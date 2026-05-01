package core

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type APIKey struct {
	ID         uuid.UUID  `json:"id"`
	AccountID  uuid.UUID  `json:"account_id"`
	Prefix     string     `json:"prefix"`
	Name       string     `json:"name,omitempty"`
	IsActive   bool       `json:"is_active"`
	IsLive     bool       `json:"is_live"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	Key        string     `json:"key,omitempty"` // Only returned on creation
}

// GenerateAPIKey creates a new API key for an account
func (s *Service) GenerateAPIKey(ctx context.Context, accountID uuid.UUID, name string, isLive bool) (*APIKey, error) {
	// Generate random key
	keyBytes := make([]byte, 32)
	if _, err := rand.Read(keyBytes); err != nil {
		return nil, fmt.Errorf("failed to generate key: %w", err)
	}
	key := hex.EncodeToString(keyBytes)
	
	// Create prefix (first 8 chars)
	prefix := key[:8]
	
	// Hash the key for storage
	hash := sha256.Sum256([]byte(key))
	keyHash := hex.EncodeToString(hash[:])

	var id uuid.UUID
	var createdAt time.Time
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO api_keys (account_id, key_hash, prefix, name, is_live)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`, accountID, keyHash, prefix, name, isLive).Scan(&id, &createdAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create API key: %w", err)
	}

	return &APIKey{
		ID:        id,
		AccountID: accountID,
		Prefix:    prefix,
		Name:      name,
		IsActive:  true,
		IsLive:    isLive,
		CreatedAt: createdAt,
		Key:       "pk_" + key, // Return full key only once
	}, nil
}

// ListAPIKeys retrieves all API keys for an account
func (s *Service) ListAPIKeys(ctx context.Context, accountID uuid.UUID) ([]APIKey, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, account_id, prefix, COALESCE(name, ''), is_active, is_live, last_used_at, created_at
		FROM api_keys
		WHERE account_id = $1
		ORDER BY created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []APIKey
	for rows.Next() {
		var key APIKey
		err := rows.Scan(&key.ID, &key.AccountID, &key.Prefix, &key.Name, &key.IsActive, &key.IsLive, &key.LastUsedAt, &key.CreatedAt)
		if err != nil {
			return nil, err
		}
		keys = append(keys, key)
	}
	return keys, nil
}

// RevokeAPIKey deactivates an API key
func (s *Service) RevokeAPIKey(ctx context.Context, accountID, keyID uuid.UUID) error {
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE api_keys
		SET is_active = false
		WHERE id = $1 AND account_id = $2
	`, keyID, accountID)
	return err
}

// ValidateAPIKey checks if an API key is valid and returns the account ID
func (s *Service) ValidateAPIKey(ctx context.Context, key string) (uuid.UUID, error) {
	// Remove prefix if present
	if len(key) > 3 && key[:3] == "pk_" {
		key = key[3:]
	}

	// Hash the key
	hash := sha256.Sum256([]byte(key))
	keyHash := hex.EncodeToString(hash[:])

	var accountID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, `
		SELECT account_id
		FROM api_keys
		WHERE key_hash = $1 AND is_active = true
	`, keyHash).Scan(&accountID)

	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid API key")
	}

	// Update last used
	s.db.Pool.Exec(ctx, `UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1`, keyHash)

	return accountID, nil
}
