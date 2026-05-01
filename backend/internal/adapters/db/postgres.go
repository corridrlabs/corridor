package db

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"log"
	"strings"
	"time"
)

type Postgres struct {
	Pool *pgxpool.Pool
}

func NewPostgres(connString string) (*Postgres, error) {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database url (check for special characters or invalid format): %w", err)
	}

	// 1. Check for potential port misconfiguration for Supabase Pooler
	if (config.ConnConfig.Host == "aws-1-us-east-2.pooler.supabase.com" ||
		config.ConnConfig.Host == "aws-0-us-east-1.pooler.supabase.com" ||
		strings.Contains(config.ConnConfig.Host, ".pooler.supabase.com")) &&
		config.ConnConfig.Port == 5432 {
		log.Println("ADVISORY: host detected as Supabase Pooler on port 5432. Auto-switching to port 6543 (Transaction Mode) for better compatibility with Render/pgx.")
		config.ConnConfig.Port = 6543
	}

	// Supabase pooler + prepared statements can cause stmtcache collisions (42P05).
	// Use simple protocol for pooler hosts to avoid server-side prepared statement reuse.
	if strings.Contains(config.ConnConfig.Host, ".pooler.supabase.com") {
		config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
		log.Println("ADVISORY: Supabase pooler detected. Enabling pgx simple protocol to avoid prepared statement cache conflicts.")
	}

	// 2. Connect via pgx/v5 (optimized for Supabase)
	log.Printf("Connecting to database at host: %s, database: %s, user: %s", config.ConnConfig.Host, config.ConnConfig.Database, config.ConnConfig.User)

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// 3. Immediate Ping check with retries for project wake-up (up to 60s)
	var lastErr error
	for i := 0; i < 6; i++ {
		pingCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		err := pool.Ping(pingCtx)
		cancel()

		if err == nil {
			log.Println("Connected to PostgreSQL (pgx/v5)")
			return &Postgres{Pool: pool}, nil
		}

		lastErr = err
		log.Printf("Database ping failed (attempt %d/6): %v", i+1, err)
		if strings.Contains(err.Error(), "Tenant or user not found") && config.ConnConfig.Port == 5432 {
			log.Println("CRITICAL: Supabase Pooler error 'Tenant or user not found' detected on port 5432.")
			log.Println("ACTION REQUIRED: Change your database port to 6543 in the connection string (Transaction Mode).")
		}
		log.Println("Retrying in 10s...")
		time.Sleep(10 * time.Second)
	}

	pool.Close()
	return nil, fmt.Errorf("database ping failed after 60s (FATAL: project may be paused, credentials incorrect, or network blocked): %w", lastErr)
}

func (p *Postgres) Close() {
	p.Pool.Close()
}

// Wrapper methods for legacy code support
func (p *Postgres) Exec(query string, args ...interface{}) (interface{}, error) {
	return p.Pool.Exec(context.Background(), query, args...)
}

func (p *Postgres) QueryRow(query string, args ...interface{}) RowWrapper {
	return sRowWrapper{p.Pool.QueryRow(context.Background(), query, args...)}
}

func (p *Postgres) Query(query string, args ...interface{}) (RowsWrapper, error) {
	rows, err := p.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	return sRowsWrapper{rows}, nil
}

type RowWrapper interface {
	Scan(dest ...interface{}) error
}

type RowsWrapper interface {
	Next() bool
	Scan(dest ...interface{}) error
	Close()
}

type sRowWrapper struct {
	row interface {
		Scan(dest ...interface{}) error
	}
}

func (w sRowWrapper) Scan(dest ...interface{}) error {
	return w.row.Scan(dest...)
}

type sRowsWrapper struct {
	rows interface {
		Next() bool
		Scan(dest ...interface{}) error
		Close()
	}
}

func (w sRowsWrapper) Next() bool {
	return w.rows.Next()
}

func (w sRowsWrapper) Scan(dest ...interface{}) error {
	return w.rows.Scan(dest...)
}

func (w sRowsWrapper) Close() {
	w.rows.Close()
}
