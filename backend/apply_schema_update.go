package main

import (
	"context"
	"fmt"
	"io/ioutil"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	db, err := pgxpool.New(context.Background(), "postgres://postgres:postgres@localhost:5432/corridor_v2?sslmode=disable")
	if err != nil {
		panic(fmt.Sprintf("Failed to connect: %v", err))
	}
	defer db.Close()

	fmt.Println("Applying migration v1...")
	sqlV1 := `
		ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(50);
		ALTER TABLE accounts ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'KE';
	`
	_, err = db.Exec(context.Background(), sqlV1)
	if err != nil {
		panic(fmt.Sprintf("Migration v1 failed: %v", err))
	}
	fmt.Println("Schema updated successfully for v1")

	fmt.Println("Applying migration v7...")
	sqlV7, err := ioutil.ReadFile("migration_v7.sql")
	if err != nil {
		panic(fmt.Sprintf("Failed to read migration_v7.sql: %v", err))
	}

	_, err = db.Exec(context.Background(), string(sqlV7))
	if err != nil {
		panic(fmt.Sprintf("Migration v7 failed: %v", err))
	}
	fmt.Println("Applying payment requests migration...")
	sqlRequests, err := ioutil.ReadFile("migration_requests.sql")
	if err != nil {
		panic(fmt.Sprintf("Failed to read migration_requests.sql: %v", err))
	}

	_, err = db.Exec(context.Background(), string(sqlRequests))
	if err != nil {
		panic(fmt.Sprintf("Migration requests failed: %v", err))
	}
	fmt.Println("Schema updated successfully for payment requests")
}
