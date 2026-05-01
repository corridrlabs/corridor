package health

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

type ReadinessChecker struct {
	db           *sql.DB
	redis        *redis.Client
	dependencies []Dependency
	mu           sync.RWMutex
	lastCheck    time.Time
	isReady      bool
	checkResults map[string]bool
}

type Dependency interface {
	Name() string
	Check(ctx context.Context) error
}

type ReadinessResponse struct {
	Ready        bool              `json:"ready"`
	Timestamp    time.Time         `json:"timestamp"`
	Dependencies map[string]bool   `json:"dependencies"`
	Errors       map[string]string `json:"errors,omitempty"`
}

// External service dependency
type ExternalServiceDep struct {
	name string
	url  string
}

func (e *ExternalServiceDep) Name() string {
	return e.name
}

func (e *ExternalServiceDep) Check(ctx context.Context) error {
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET", e.url, nil)
	if err != nil {
		return err
	}
	
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode >= 400 {
		return http.ErrServerClosed
	}
	
	return nil
}

func NewReadinessChecker(db *sql.DB, redis *redis.Client) *ReadinessChecker {
	return &ReadinessChecker{
		db:           db,
		redis:        redis,
		dependencies: make([]Dependency, 0),
		checkResults: make(map[string]bool),
	}
}

func (r *ReadinessChecker) AddDependency(dep Dependency) {
	r.dependencies = append(r.dependencies, dep)
}

func (r *ReadinessChecker) ReadyHandler(w http.ResponseWriter, req *http.Request) {
	ctx, cancel := context.WithTimeout(req.Context(), 10*time.Second)
	defer cancel()

	response := r.checkReadiness(ctx)
	
	w.Header().Set("Content-Type", "application/json")
	if response.Ready {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	
	json.NewEncoder(w).Encode(response)
}

func (r *ReadinessChecker) checkReadiness(ctx context.Context) ReadinessResponse {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	
	// Cache results for 30 seconds to avoid overwhelming dependencies
	if now.Sub(r.lastCheck) < 30*time.Second {
		return ReadinessResponse{
			Ready:        r.isReady,
			Timestamp:    r.lastCheck,
			Dependencies: r.checkResults,
		}
	}

	dependencies := make(map[string]bool)
	errors := make(map[string]string)
	allReady := true

	// Check database
	if err := r.checkDatabase(ctx); err != nil {
		dependencies["database"] = false
		errors["database"] = err.Error()
		allReady = false
	} else {
		dependencies["database"] = true
	}

	// Check Redis (optional - don't fail if not available)
	if r.redis != nil {
		if err := r.checkRedis(ctx); err != nil {
			dependencies["redis"] = false
			errors["redis"] = err.Error()
			allReady = false
		} else {
			dependencies["redis"] = true
		}
	} else {
		dependencies["redis"] = false
	}

	// Check external dependencies
	for _, dep := range r.dependencies {
		if err := dep.Check(ctx); err != nil {
			dependencies[dep.Name()] = false
			errors[dep.Name()] = err.Error()
			allReady = false
		} else {
			dependencies[dep.Name()] = true
		}
	}

	// Update cache
	r.lastCheck = now
	r.isReady = allReady
	r.checkResults = dependencies

	response := ReadinessResponse{
		Ready:        allReady,
		Timestamp:    now,
		Dependencies: dependencies,
	}

	if len(errors) > 0 {
		response.Errors = errors
	}

	return response
}

func (r *ReadinessChecker) checkDatabase(ctx context.Context) error {
	// Check basic connectivity
	if err := r.db.PingContext(ctx); err != nil {
		return err
	}

	// Check if we can execute queries
	var result int
	err := r.db.QueryRowContext(ctx, "SELECT 1").Scan(&result)
	if err != nil {
		return err
	}

	// Check if critical tables exist
	var tableExists bool
	err = r.db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = 'users'
		)
	`).Scan(&tableExists)
	
	if err != nil {
		return err
	}
	
	if !tableExists {
		return sql.ErrNoRows
	}

	return nil
}

func (r *ReadinessChecker) checkRedis(ctx context.Context) error {
	// Check basic connectivity
	if err := r.redis.Ping(ctx).Err(); err != nil {
		return err
	}

	// Test basic operations
	testKey := "readiness_check"
	if err := r.redis.Set(ctx, testKey, "ok", time.Minute).Err(); err != nil {
		return err
	}

	val, err := r.redis.Get(ctx, testKey).Result()
	if err != nil {
		return err
	}

	if val != "ok" {
		return redis.Nil
	}

	// Clean up
	r.redis.Del(ctx, testKey)

	return nil
}

// IsReady returns the current readiness status without performing checks
func (r *ReadinessChecker) IsReady() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	// Consider stale if last check was more than 5 minutes ago
	if time.Since(r.lastCheck) > 5*time.Minute {
		return false
	}
	
	return r.isReady
}

// StartPeriodicChecks runs readiness checks in the background
func (r *ReadinessChecker) StartPeriodicChecks(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			r.checkReadiness(ctx)
			cancel()
		}
	}()
}
