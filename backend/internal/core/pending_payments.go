package core

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// PendingPayment represents a payment waiting to be claimed
type PendingPayment struct {
	ID              uuid.UUID
	SenderID        uuid.UUID
	RecipientEmail  string
	RecipientHandle string
	Amount          float64
	Currency        string
	ClaimToken      string
	Status          string
	ExpiresAt       time.Time
	CreatedAt       time.Time
}

// CreatePendingPayment creates a pending payment for a non-user
func (s *Service) CreatePendingPayment(ctx context.Context, senderID uuid.UUID, recipientEmail string, amount float64, currency string) (*PendingPayment, error) {
	// Generate secure claim token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, fmt.Errorf("failed to generate claim token: %w", err)
	}
	claimToken := hex.EncodeToString(tokenBytes)

	// Expires in 30 days
	expiresAt := time.Now().Add(30 * 24 * time.Hour)

	var pp PendingPayment
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO pending_payments (sender_id, recipient_email, amount, currency, claim_token, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, sender_id, recipient_email, amount, currency, claim_token, status, expires_at, created_at
	`, senderID, recipientEmail, amount, currency, claimToken, expiresAt).Scan(
		&pp.ID, &pp.SenderID, &pp.RecipientEmail, &pp.Amount, &pp.Currency,
		&pp.ClaimToken, &pp.Status, &pp.ExpiresAt, &pp.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create pending payment: %w", err)
	}

	return &pp, nil
}

// GetAccountIDByHandle retrieves account ID by username/handle
func (s *Service) GetAccountIDByHandle(ctx context.Context, handle string) (uuid.UUID, error) {
	var id uuid.UUID
	// Remove @ prefix if present
	if len(handle) > 0 && handle[0] == '@' {
		handle = handle[1:]
	}
	err := s.db.Pool.QueryRow(ctx, "SELECT id FROM accounts WHERE username = $1", handle).Scan(&id)
	if err != nil {
		return uuid.Nil, err
	}
	return id, nil
}
