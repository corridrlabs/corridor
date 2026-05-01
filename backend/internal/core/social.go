package core

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// CreateSocialPayment executes a transfer and adds social metadata
func (s *Service) CreateSocialPayment(ctx context.Context, fromID, toID uuid.UUID, amount float64, message string, contextData map[string]interface{}) (*Transaction, error) {
	// 1. Execute Core Financial Transaction
	tx, err := s.InternalTransfer(ctx, fromID, toID, amount, message)
	if err != nil {
		return nil, err
	}

	// 2. Update Social Visibility (default Public)
	_, err = s.db.Pool.Exec(ctx, `
		UPDATE transactions 
		SET visibility = 'PUBLIC', context = $2
		WHERE id = $1
	`, tx.ID, contextData)

	return tx, err
}

// GetSocialFeed returns the activity feed for the current account.
// This intentionally scopes rows to the signed-in user's own activity so
// seeded/demo transactions from other accounts do not leak into every feed.
func (s *Service) GetSocialFeed(ctx context.Context, accountID uuid.UUID) ([]Transaction, error) {
	query := `
		WITH network_accounts AS (
			SELECT $1::uuid AS account_id
			UNION
			SELECT following_id AS account_id
			FROM social_connections
			WHERE follower_id = $1
		)
		SELECT
			t.id,
			t.sender_wallet_id,
			t.recipient_wallet_id,
			t.amount,
			t.currency,
			t.status,
			t.message,
			COALESCE(gc.contributor_name, sender_acc.full_name, recipient_acc.full_name, 'Corridor user') AS actor_name,
			t.created_at
		FROM transactions t
		LEFT JOIN wallets sender_wallet ON sender_wallet.id = t.sender_wallet_id
		LEFT JOIN accounts sender_acc ON sender_acc.id = sender_wallet.account_id
		LEFT JOIN wallets recipient_wallet ON recipient_wallet.id = t.recipient_wallet_id
		LEFT JOIN accounts recipient_acc ON recipient_acc.id = recipient_wallet.account_id
		LEFT JOIN social_goals sg
		  ON sg.id = CASE
			WHEN (t.context->>'goal_id') ~* '^[0-9a-f-]{36}$' THEN (t.context->>'goal_id')::uuid
			ELSE NULL
		  END
		LEFT JOIN goal_contributions gc ON gc.transaction_id = t.id
		WHERE t.visibility = 'PUBLIC'
		  AND (
			sender_wallet.account_id IN (SELECT account_id FROM network_accounts)
			OR recipient_wallet.account_id IN (SELECT account_id FROM network_accounts)
			OR sg.account_id IN (SELECT account_id FROM network_accounts)
		  )
		ORDER BY created_at DESC
		LIMIT 20
	`

	rows, err := s.db.Pool.Query(ctx, query, accountID)
	if err != nil {
		fallback := `
			SELECT
				t.id,
				t.sender_wallet_id,
				t.recipient_wallet_id,
				t.amount,
				t.currency,
				t.status,
				t.message,
				COALESCE(gc.contributor_name, sender_acc.full_name, recipient_acc.full_name, 'Corridor user') AS actor_name,
				t.created_at
			FROM transactions t
			LEFT JOIN wallets sender_wallet ON sender_wallet.id = t.sender_wallet_id
			LEFT JOIN accounts sender_acc ON sender_acc.id = sender_wallet.account_id
			LEFT JOIN wallets recipient_wallet ON recipient_wallet.id = t.recipient_wallet_id
			LEFT JOIN accounts recipient_acc ON recipient_acc.id = recipient_wallet.account_id
			LEFT JOIN goal_contributions gc ON gc.transaction_id = t.id
			WHERE t.visibility = 'PUBLIC'
			  AND (
				sender_wallet.account_id = $1
				OR recipient_wallet.account_id = $1
			  )
			ORDER BY created_at DESC
			LIMIT 20
		`

		if strings.Contains(strings.ToLower(err.Error()), "social_connections") || strings.Contains(strings.ToLower(err.Error()), "does not exist") {
			rows, err = s.db.Pool.Query(ctx, fallback, accountID)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	defer rows.Close()

	var feed []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.SenderWalletID, &t.RecipientWalletID, &t.Amount, &t.Currency, &t.Status, &t.Message, &t.ActorName, &t.CreatedAt); err != nil {
			return nil, err
		}
		feed = append(feed, t)
	}
	return feed, nil
}

type PaymentRequest struct {
	ID          uuid.UUID `json:"id"`
	RequesterID uuid.UUID `json:"requester_id"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	PayerEmail  string    `json:"payer_email"`
	Memo        string    `json:"memo"`
	Status      string    `json:"status"`
}

func (s *Service) CreatePaymentRequest(ctx context.Context, requesterID uuid.UUID, amount float64, currency, payerEmail, memo string) (*PaymentRequest, error) {
	var pr PaymentRequest
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO payment_requests (requester_id, amount, currency, payer_email, memo, status)
		VALUES ($1, $2, $3, $4, $5, 'PENDING')
		RETURNING id, requester_id, amount, currency, payer_email, memo, status
	`, requesterID, amount, currency, payerEmail, memo).Scan(
		&pr.ID, &pr.RequesterID, &pr.Amount, &pr.Currency, &pr.PayerEmail, &pr.Memo, &pr.Status,
	)
	if err != nil {
		return nil, err
	}
	return &pr, nil
}

func (s *Service) FollowAccount(ctx context.Context, followerID, followingID uuid.UUID) error {
	if followerID == uuid.Nil || followingID == uuid.Nil {
		return fmt.Errorf("invalid account id")
	}
	if followerID == followingID {
		return fmt.Errorf("you cannot follow yourself")
	}

	var exists bool
	if err := s.db.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM accounts WHERE id = $1)`, followingID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("account not found")
	}

	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO social_connections (follower_id, following_id)
		VALUES ($1, $2)
		ON CONFLICT (follower_id, following_id) DO NOTHING
	`, followerID, followingID)
	return err
}

func (s *Service) UnfollowAccount(ctx context.Context, followerID, followingID uuid.UUID) error {
	if followerID == uuid.Nil || followingID == uuid.Nil {
		return fmt.Errorf("invalid account id")
	}

	_, err := s.db.Pool.Exec(ctx, `
		DELETE FROM social_connections
		WHERE follower_id = $1 AND following_id = $2
	`, followerID, followingID)
	return err
}

func (s *Service) GetFollowingAccounts(ctx context.Context, accountID uuid.UUID) ([]SocialAccountSummary, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT
			a.id,
			a.full_name,
			COALESCE(a.username, ''),
			COALESCE(a.email, ''),
			a.account_type,
			COALESCE(a.country, ''),
			TRUE AS following,
			a.created_at
		FROM social_connections sc
		JOIN accounts a ON a.id = sc.following_id
		WHERE sc.follower_id = $1
		ORDER BY sc.created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []SocialAccountSummary
	for rows.Next() {
		var item SocialAccountSummary
		if err := rows.Scan(&item.ID, &item.FullName, &item.Username, &item.Email, &item.AccountType, &item.Country, &item.Following, &item.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func (s *Service) SearchSocialAccounts(ctx context.Context, accountID uuid.UUID, query string, limit int) ([]SocialAccountSummary, error) {
	query = strings.TrimSpace(query)
	if limit <= 0 || limit > 20 {
		limit = 8
	}

	rows, err := s.db.Pool.Query(ctx, `
		SELECT
			a.id,
			a.full_name,
			COALESCE(a.username, ''),
			COALESCE(a.email, ''),
			a.account_type,
			COALESCE(a.country, ''),
			EXISTS(
				SELECT 1 FROM social_connections sc
				WHERE sc.follower_id = $1 AND sc.following_id = a.id
			) AS following,
			a.created_at
		FROM accounts a
		WHERE a.id <> $1
		  AND (
			$2 = ''
			OR a.full_name ILIKE '%' || $2 || '%'
			OR COALESCE(a.username, '') ILIKE '%' || $2 || '%'
			OR a.email ILIKE '%' || $2 || '%'
		  )
		ORDER BY following DESC, a.full_name ASC
		LIMIT $3
	`, accountID, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []SocialAccountSummary
	for rows.Next() {
		var item SocialAccountSummary
		if err := rows.Scan(&item.ID, &item.FullName, &item.Username, &item.Email, &item.AccountType, &item.Country, &item.Following, &item.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}
