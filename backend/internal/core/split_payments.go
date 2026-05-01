package core

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type SplitRequest struct {
	ID           uuid.UUID `json:"id"`
	CreatorID    uuid.UUID `json:"creator_id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	TotalAmount  float64   `json:"total_amount"`
	Currency     string    `json:"currency"`
	ItemLink     string    `json:"item_link,omitempty"`
	Status       string    `json:"status"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type SplitParticipant struct {
	ID           uuid.UUID `json:"id"`
	SplitID      uuid.UUID `json:"split_id"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone,omitempty"`
	Amount       float64   `json:"amount"`
	Status       string    `json:"status"`
	InviteToken  string    `json:"invite_token"`
	PaidAt       *time.Time `json:"paid_at,omitempty"`
}

func (s *Service) CreateSplitRequest(ctx context.Context, creatorID uuid.UUID, title, description string, totalAmount float64, currency, itemLink string, participants []string) (*SplitRequest, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Create split request
	splitID := uuid.New()
	expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days

	var split SplitRequest
	err = tx.QueryRow(ctx, `
		INSERT INTO split_requests (id, creator_id, title, description, total_amount, currency, item_link, status, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
		RETURNING id, creator_id, title, description, total_amount, currency, item_link, status, expires_at, created_at
	`, splitID, creatorID, title, description, totalAmount, currency, itemLink, expiresAt).Scan(
		&split.ID, &split.CreatorID, &split.Title, &split.Description,
		&split.TotalAmount, &split.Currency, &split.ItemLink, &split.Status,
		&split.ExpiresAt, &split.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Add participants
	amountPerPerson := totalAmount / float64(len(participants))
	for _, contact := range participants {
		inviteToken := uuid.New().String()[:8]
		
		_, err = tx.Exec(ctx, `
			INSERT INTO split_participants (split_id, email, amount, status, invite_token)
			VALUES ($1, $2, $3, 'INVITED', $4)
		`, splitID, contact, amountPerPerson, inviteToken)
		if err != nil {
			return nil, err
		}

		// Send invite (async)
		go s.sendSplitInvite(contact, split.Title, amountPerPerson, currency, inviteToken)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &split, nil
}

func (s *Service) PaySplitShare(ctx context.Context, inviteToken string, payerEmail string) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get participant details
	var participantID uuid.UUID
	var splitID uuid.UUID
	var amount float64
	var currency string
	
	err = tx.QueryRow(ctx, `
		SELECT sp.id, sp.split_id, sp.amount, sr.currency
		FROM split_participants sp
		JOIN split_requests sr ON sp.split_id = sr.id
		WHERE sp.invite_token = $1 AND sp.status = 'INVITED'
		FOR UPDATE
	`, inviteToken).Scan(&participantID, &splitID, &amount, &currency)
	if err != nil {
		return fmt.Errorf("invalid invite token or already paid")
	}

	// Mark as paid
	_, err = tx.Exec(ctx, `
		UPDATE split_participants 
		SET status = 'PAID', paid_at = NOW()
		WHERE id = $1
	`, participantID)
	if err != nil {
		return err
	}

	// Check if split is fully funded
	var totalPaid float64
	var totalAmount float64
	err = tx.QueryRow(ctx, `
		SELECT 
			COALESCE(SUM(CASE WHEN sp.status = 'PAID' THEN sp.amount ELSE 0 END), 0) as paid,
			sr.total_amount
		FROM split_participants sp
		JOIN split_requests sr ON sp.split_id = sr.id
		WHERE sp.split_id = $1
		GROUP BY sr.total_amount
	`, splitID).Scan(&totalPaid, &totalAmount)
	if err != nil {
		return err
	}

	// If fully funded, trigger purchase
	if totalPaid >= totalAmount {
		_, err = tx.Exec(ctx, `
			UPDATE split_requests 
			SET status = 'FUNDED'
			WHERE id = $1
		`, splitID)
		if err != nil {
			return err
		}

		// Trigger auto-purchase (async)
		go s.processSplitPurchase(splitID)
	}

	return tx.Commit(ctx)
}

func (s *Service) GetSplitRequestsByAccount(ctx context.Context, accountID uuid.UUID) ([]SplitRequest, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, creator_id, title, description, total_amount, currency, item_link, status, expires_at, created_at
		FROM split_requests
		WHERE creator_id = $1
		ORDER BY created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []SplitRequest
	for rows.Next() {
		var r SplitRequest
		err := rows.Scan(
			&r.ID, &r.CreatorID, &r.Title, &r.Description,
			&r.TotalAmount, &r.Currency, &r.ItemLink, &r.Status,
			&r.ExpiresAt, &r.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, r)
	}
	return requests, nil
}

func (s *Service) GetSplitRequest(ctx context.Context, splitID uuid.UUID) (*SplitRequest, []SplitParticipant, error) {
	var split SplitRequest
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, creator_id, title, description, total_amount, currency, item_link, status, expires_at, created_at
		FROM split_requests WHERE id = $1
	`, splitID).Scan(
		&split.ID, &split.CreatorID, &split.Title, &split.Description,
		&split.TotalAmount, &split.Currency, &split.ItemLink, &split.Status,
		&split.ExpiresAt, &split.CreatedAt,
	)
	if err != nil {
		return nil, nil, err
	}

	// Get participants
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, split_id, email, phone, amount, status, invite_token, paid_at
		FROM split_participants WHERE split_id = $1
	`, splitID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var participants []SplitParticipant
	for rows.Next() {
		var p SplitParticipant
		err := rows.Scan(&p.ID, &p.SplitID, &p.Email, &p.Phone, &p.Amount, &p.Status, &p.InviteToken, &p.PaidAt)
		if err != nil {
			return nil, nil, err
		}
		participants = append(participants, p)
	}

	return &split, participants, nil
}

func (s *Service) RefundSplitRequest(ctx context.Context, splitID uuid.UUID) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Mark split as refunded
	_, err = tx.Exec(ctx, `
		UPDATE split_requests 
		SET status = 'REFUNDED'
		WHERE id = $1
	`, splitID)
	if err != nil {
		return err
	}

	// Process refunds for paid participants
	rows, err := tx.Query(ctx, `
		SELECT email, amount FROM split_participants 
		WHERE split_id = $1 AND status = 'PAID'
	`, splitID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var email string
		var amount float64
		if err := rows.Scan(&email, &amount); err != nil {
			continue
		}
		
		// Process refund (async)
		go s.processRefund(email, amount)
	}

	return tx.Commit(ctx)
}

func (s *Service) sendSplitInvite(contact, title string, amount float64, currency, token string) {
	// Mock email/SMS sending
	fmt.Printf("Sending split invite to %s for %s: %.2f %s (token: %s)\n", 
		contact, title, amount, currency, token)
}

func (s *Service) processSplitPurchase(splitID uuid.UUID) {
	// Mock auto-purchase logic
	fmt.Printf("Processing auto-purchase for split %s\n", splitID)
}

func (s *Service) processRefund(email string, amount float64) {
	// Mock refund processing
	fmt.Printf("Processing refund for %s: %.2f\n", email, amount)
}