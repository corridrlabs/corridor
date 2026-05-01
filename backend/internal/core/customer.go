package core

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Customer struct {
	ID        uuid.UUID              `json:"id"`
	AccountID uuid.UUID              `json:"account_id"`
	Name      string                 `json:"name"`
	Phone     string                 `json:"phone"`
	Email     string                 `json:"email,omitempty"`
	Metadata  map[string]interface{} `json:"metadata"`
	CreatedAt time.Time              `json:"created_at"`
	UpdatedAt time.Time              `json:"updated_at"`
}

// CreateCustomer creates a new customer for an account
func (s *Service) CreateCustomer(ctx context.Context, accountID uuid.UUID, name, phone, email string) (*Customer, error) {
	var id uuid.UUID
	var createdAt, updatedAt time.Time

	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO customers (account_id, name, phone, email)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`, accountID, name, phone, email).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	return &Customer{
		ID:        id,
		AccountID: accountID,
		Name:      name,
		Phone:     phone,
		Email:     email,
		Metadata:  make(map[string]interface{}),
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}, nil
}

// GetCustomers retrieves all customers for an account
func (s *Service) GetCustomers(ctx context.Context, accountID uuid.UUID) ([]Customer, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, account_id, name, phone, COALESCE(email, ''), created_at, updated_at
		FROM customers
		WHERE account_id = $1
		ORDER BY created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var c Customer
		if err := rows.Scan(&c.ID, &c.AccountID, &c.Name, &c.Phone, &c.Email, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		c.Metadata = make(map[string]interface{})
		customers = append(customers, c)
	}
	return customers, nil
}

// GetCustomer retrieves a single customer by ID (with ownership check)
func (s *Service) GetCustomer(ctx context.Context, accountID, customerID uuid.UUID) (*Customer, error) {
	var c Customer
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, account_id, name, phone, COALESCE(email, ''), created_at, updated_at
		FROM customers
		WHERE id = $1 AND account_id = $2
	`, customerID, accountID).Scan(&c.ID, &c.AccountID, &c.Name, &c.Phone, &c.Email, &c.CreatedAt, &c.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("customer not found: %w", err)
	}
	c.Metadata = make(map[string]interface{})
	return &c, nil
}
