package core

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/google/uuid"
)

type Chama struct {
	ID              uuid.UUID `json:"id"`
	CreatorID       uuid.UUID `json:"creator_id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	TotalPayoutGoal float64   `json:"total_payout_goal"`
	Currency        string    `json:"currency"`
	Status          string    `json:"status"`
	ShareLink       string    `json:"share_link"`
	CreatedAt       string    `json:"created_at"`
}

type ChamaMember struct {
	ID                 uuid.UUID `json:"id"`
	ChamaID            uuid.UUID `json:"chama_id"`
	AccountID          uuid.UUID `json:"account_id"`
	Role               string    `json:"role"`
	ContributionAmount float64   `json:"contribution_amount"`
	CreatedAt          string    `json:"created_at"`
}

func (s *Service) CreateChama(ctx context.Context, creatorID uuid.UUID, name, description string, goal float64, currency string) (*Chama, error) {
	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_APP_URL")), "/")
	if baseURL == "" {
		baseURL = strings.TrimRight(strings.TrimSpace(os.Getenv("VITE_APP_URL")), "/")
	}

	chamaID := uuid.New()
	shareLink := fmt.Sprintf("/chama/%s", chamaID.String()[:8])
	if baseURL != "" {
		shareLink = fmt.Sprintf("%s/chama/%s", baseURL, chamaID.String()[:8])
	}

	var chama Chama
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO chamas (id, creator_id, name, description, total_payout_goal, currency, share_link)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, creator_id, name, description, total_payout_goal, currency, status, share_link, created_at
	`, chamaID, creatorID, name, description, goal, currency, shareLink).Scan(
		&chama.ID, &chama.CreatorID, &chama.Name, &chama.Description,
		&chama.TotalPayoutGoal, &chama.Currency, &chama.Status, &chama.ShareLink, &chama.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Add creator as Admin member
	_, err = s.db.Pool.Exec(ctx, `
		INSERT INTO chama_members (chama_id, account_id, role)
		VALUES ($1, $2, 'ADMIN')
	`, chama.ID, creatorID)

	return &chama, err
}

func (s *Service) GetChamasByAccount(ctx context.Context, accountID uuid.UUID) ([]Chama, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT c.id, c.creator_id, c.name, c.description, c.total_payout_goal, c.currency, c.status, c.share_link, c.created_at
		FROM chamas c
		JOIN chama_members cm ON cm.chama_id = c.id
		WHERE cm.account_id = $1
		ORDER BY c.created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chamas []Chama
	for rows.Next() {
		var c Chama
		err := rows.Scan(&c.ID, &c.CreatorID, &c.Name, &c.Description, &c.TotalPayoutGoal, &c.Currency, &c.Status, &c.ShareLink, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		chamas = append(chamas, c)
	}
	return chamas, nil
}

func (s *Service) JoinChama(ctx context.Context, chamaID, accountID uuid.UUID) error {
	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO chama_members (chama_id, account_id, role)
		VALUES ($1, $2, 'MEMBER')
		ON CONFLICT (chama_id, account_id) DO NOTHING
	`, chamaID, accountID)
	return err
}
