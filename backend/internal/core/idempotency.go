package core

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
)

type IdempotencyRecord struct {
	ID              uuid.UUID
	KeyHash         string
	AccountID       uuid.UUID
	RequestPath     string
	RequestBodyHash string
	ResponseCode    *int
	ResponseBody    *string
	CreatedAt       time.Time
	ExpiresAt       time.Time
}

func (s *Service) StartIdempotentRequest(ctx context.Context, accountID uuid.UUID, key string, path string, body []byte) (bool, *IdempotencyRecord, error) {
	keyHash := hashString(key)
	bodyHash := hashBytes(body)

	var rec IdempotencyRecord
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, key_hash, account_id, request_path, request_body_hash, response_code, response_body, created_at, expires_at
		FROM idempotency_keys
		WHERE key_hash = $1
	`, keyHash).Scan(&rec.ID, &rec.KeyHash, &rec.AccountID, &rec.RequestPath, &rec.RequestBodyHash, &rec.ResponseCode, &rec.ResponseBody, &rec.CreatedAt, &rec.ExpiresAt)

	if err == nil {
		// Do not allow replaying same key with different request/account.
		if rec.AccountID != accountID || rec.RequestPath != path || rec.RequestBodyHash != bodyHash {
			return true, nil, ErrIdempotencyKeyMismatch
		}

		// Expired keys should no longer be re-used.
		if rec.ExpiresAt.Before(time.Now()) {
			return true, nil, ErrIdempotencyKeyExpired
		}

		// Key exists
		return true, &rec, nil
	}

	// Key doesn't exist, create it
	err = s.db.Pool.QueryRow(ctx, `
		INSERT INTO idempotency_keys (key_hash, account_id, request_path, request_body_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, keyHash, accountID, path, bodyHash).Scan(&rec.ID, &rec.CreatedAt)

	if err != nil {
		return false, nil, err
	}

	rec.KeyHash = keyHash
	rec.AccountID = accountID
	rec.RequestPath = path
	rec.RequestBodyHash = bodyHash
	rec.ExpiresAt = time.Now().Add(24 * time.Hour)

	return false, &rec, nil
}

var (
	ErrIdempotencyKeyMismatch = &idempotencyError{Message: "idempotency key cannot be reused with different request parameters"}
	ErrIdempotencyKeyExpired  = &idempotencyError{Message: "idempotency key expired"}
)

type idempotencyError struct {
	Message string
}

func (e *idempotencyError) Error() string {
	return e.Message
}

func (s *Service) CompleteIdempotentRequest(ctx context.Context, key string, code int, response string) error {
	keyHash := hashString(key)
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE idempotency_keys
		SET response_code = $1, response_body = $2
		WHERE key_hash = $3
	`, code, response, keyHash)
	return err
}

func hashString(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func hashBytes(b []byte) string {
	h := sha256.New()
	h.Write(b)
	return hex.EncodeToString(h.Sum(nil))
}
