package core

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Webhook struct {
	ID        uuid.UUID `json:"id"`
	AccountID uuid.UUID `json:"account_id"`
	URL       string    `json:"url"`
	Events    []string  `json:"events"`
	Secret    string    `json:"secret,omitempty"` // Only returned on creation
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type WebhookDelivery struct {
	ID          uuid.UUID              `json:"id"`
	WebhookID   uuid.UUID              `json:"webhook_id"`
	EventType   string                 `json:"event_type"`
	Payload     map[string]interface{} `json:"payload"`
	Status      string                 `json:"status"`
	Attempts    int                    `json:"attempts"`
	CreatedAt   time.Time              `json:"created_at"`
	DeliveredAt *time.Time             `json:"delivered_at,omitempty"`
}

// CreateWebhook creates a new webhook endpoint
func (s *Service) CreateWebhook(ctx context.Context, accountID uuid.UUID, url string, events []string) (*Webhook, error) {
	// Generate webhook secret
	secretBytes := make([]byte, 32)
	if _, err := rand.Read(secretBytes); err != nil {
		return nil, fmt.Errorf("failed to generate secret: %w", err)
	}
	secret := "whsec_" + hex.EncodeToString(secretBytes)

	var id uuid.UUID
	var createdAt time.Time
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO webhooks (account_id, url, events, secret)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, accountID, url, events, secret).Scan(&id, &createdAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create webhook: %w", err)
	}

	return &Webhook{
		ID:        id,
		AccountID: accountID,
		URL:       url,
		Events:    events,
		Secret:    secret,
		IsActive:  true,
		CreatedAt: createdAt,
	}, nil
}

// ListWebhooks retrieves all webhooks for an account
func (s *Service) ListWebhooks(ctx context.Context, accountID uuid.UUID) ([]Webhook, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, account_id, url, events, is_active, created_at
		FROM webhooks
		WHERE account_id = $1
		ORDER BY created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []Webhook
	for rows.Next() {
		var wh Webhook
		err := rows.Scan(&wh.ID, &wh.AccountID, &wh.URL, &wh.Events, &wh.IsActive, &wh.CreatedAt)
		if err != nil {
			return nil, err
		}
		webhooks = append(webhooks, wh)
	}
	return webhooks, nil
}

// DeleteWebhook removes a webhook
func (s *Service) DeleteWebhook(ctx context.Context, accountID, webhookID uuid.UUID) error {
	_, err := s.db.Pool.Exec(ctx, `DELETE FROM webhooks WHERE id = $1 AND account_id = $2`, webhookID, accountID)
	return err
}

// TriggerWebhook sends a webhook event
func (s *Service) TriggerWebhook(ctx context.Context, accountID uuid.UUID, eventType string, payload map[string]interface{}) error {
	// Get all webhooks for this account that listen to this event
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, url, secret
		FROM webhooks
		WHERE account_id = $1 AND is_active = true AND $2 = ANY(events)
	`, accountID, eventType)
	if err != nil {
		return err
	}
	defer rows.Close()

	payloadJSON, _ := json.Marshal(payload)

	for rows.Next() {
		var webhookID uuid.UUID
		var url, secret string
		rows.Scan(&webhookID, &url, &secret)

		// Create delivery record
		_, err := s.db.Pool.Exec(ctx, `
			INSERT INTO webhook_deliveries (webhook_id, event_type, payload)
			VALUES ($1, $2, $3)
		`, webhookID, eventType, payloadJSON)

		if err != nil {
			continue
		}

		// TODO: Actually send HTTP request to webhook URL
		// For now, just log
		fmt.Printf("Would send webhook to %s for event %s\n", url, eventType)
	}

	return nil
}

// GenerateWebhookSignature creates an HMAC signature for webhook verification
func GenerateWebhookSignature(secret string, payload []byte) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}
