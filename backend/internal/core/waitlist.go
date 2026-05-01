package core

import (
	"context"
	"fmt"
	"html"
	"strings"
	"time"

	"github.com/google/uuid"
)

type WaitlistEntry struct {
	ID               uuid.UUID  `json:"id"`
	Name             string     `json:"name"`
	Email            string     `json:"email"`
	Company          string     `json:"company"`
	Segment          string     `json:"segment"`
	UseCase          string     `json:"use_case"`
	PreferredChannel string     `json:"preferred_channel"`
	Volume           string     `json:"volume"`
	Notes            string     `json:"notes"`
	Status           string     `json:"status"`
	LastContactedAt  *time.Time `json:"last_contacted_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type WaitlistPage struct {
	Items   []WaitlistEntry `json:"items"`
	Page    int             `json:"page"`
	Limit   int             `json:"limit"`
	Total   int             `json:"total"`
	HasMore bool            `json:"has_more"`
}

type CreateWaitlistInput struct {
	Name             string `json:"name"`
	Email            string `json:"email"`
	Company          string `json:"company"`
	Segment          string `json:"segment"`
	UseCase          string `json:"use_case"`
	PreferredChannel string `json:"preferred_channel"`
	Volume           string `json:"volume"`
	Notes            string `json:"notes"`
}

func normalizeWaitlistStatus(status string) string {
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "NEW", "CONTACTED", "QUALIFIED", "ARCHIVED":
		return strings.ToUpper(strings.TrimSpace(status))
	default:
		return "NEW"
	}
}

func (s *Service) CreateWaitlistEntry(ctx context.Context, in CreateWaitlistInput) (*WaitlistEntry, error) {
	name := strings.TrimSpace(in.Name)
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if name == "" || email == "" {
		return nil, fmt.Errorf("name and email are required")
	}

	entry := &WaitlistEntry{}
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO waitlist_entries (name, email, company, segment, use_case, preferred_channel, volume, notes, status, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'NEW',NOW())
		ON CONFLICT (email) DO UPDATE SET
			name = EXCLUDED.name,
			company = EXCLUDED.company,
			segment = EXCLUDED.segment,
			use_case = EXCLUDED.use_case,
			preferred_channel = EXCLUDED.preferred_channel,
			volume = EXCLUDED.volume,
			notes = EXCLUDED.notes,
			updated_at = NOW()
		RETURNING id, name, email, COALESCE(company,''), COALESCE(segment,''), COALESCE(use_case,''), COALESCE(preferred_channel,''), COALESCE(volume,''), COALESCE(notes,''), COALESCE(status,'NEW'), last_contacted_at, created_at, updated_at
	`, name, email, strings.TrimSpace(in.Company), strings.TrimSpace(in.Segment), strings.TrimSpace(in.UseCase), strings.TrimSpace(in.PreferredChannel), strings.TrimSpace(in.Volume), strings.TrimSpace(in.Notes)).
		Scan(&entry.ID, &entry.Name, &entry.Email, &entry.Company, &entry.Segment, &entry.UseCase, &entry.PreferredChannel, &entry.Volume, &entry.Notes, &entry.Status, &entry.LastContactedAt, &entry.CreatedAt, &entry.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return entry, nil
}

func (s *Service) ListWaitlistEntries(ctx context.Context, query, status string, page, limit int) (*WaitlistPage, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit
	needle := "%" + strings.ToLower(strings.TrimSpace(query)) + "%"
	status = strings.ToUpper(strings.TrimSpace(status))

	sql := `
		SELECT id, name, email, COALESCE(company,''), COALESCE(segment,''), COALESCE(use_case,''), COALESCE(preferred_channel,''), COALESCE(volume,''), COALESCE(notes,''), COALESCE(status,'NEW'), last_contacted_at, created_at, updated_at, COUNT(*) OVER()
		FROM waitlist_entries
		WHERE (lower(name) LIKE $1 OR lower(email) LIKE $1 OR lower(COALESCE(company,'')) LIKE $1 OR lower(COALESCE(segment,'')) LIKE $1 OR lower(COALESCE(use_case,'')) LIKE $1)
	`
	args := []any{needle}
	if status != "" {
		sql += ` AND COALESCE(status,'NEW') = $2`
		args = append(args, status)
	}
	sql += ` ORDER BY created_at DESC LIMIT $3 OFFSET $4`
	if status != "" {
		args = append(args, limit, offset)
	} else {
		args = append(args, limit, offset)
	}

	rows, err := s.db.Pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	pageResp := &WaitlistPage{Items: []WaitlistEntry{}, Page: page, Limit: limit}
	var total int
	for rows.Next() {
		var item WaitlistEntry
		if err := rows.Scan(&item.ID, &item.Name, &item.Email, &item.Company, &item.Segment, &item.UseCase, &item.PreferredChannel, &item.Volume, &item.Notes, &item.Status, &item.LastContactedAt, &item.CreatedAt, &item.UpdatedAt, &total); err != nil {
			return nil, err
		}
		pageResp.Items = append(pageResp.Items, item)
	}
	pageResp.Total = total
	pageResp.HasMore = page*limit < total
	return pageResp, nil
}

func (s *Service) UpdateWaitlistStatus(ctx context.Context, id uuid.UUID, status string) error {
	status = normalizeWaitlistStatus(status)
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE waitlist_entries
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`, status, id)
	return err
}

func (s *Service) SendWaitlistCampaign(ctx context.Context, actorID uuid.UUID, subject, message string, statusFilter string) (int, error) {
	subject = strings.TrimSpace(subject)
	message = strings.TrimSpace(message)
	if subject == "" || message == "" {
		return 0, fmt.Errorf("subject and message are required")
	}

	statusFilter = strings.ToUpper(strings.TrimSpace(statusFilter))
	query := `SELECT email, name FROM waitlist_entries`
	args := []any{}
	if statusFilter != "" {
		query += ` WHERE COALESCE(status,'NEW') = $1`
		args = append(args, statusFilter)
	}

	rows, err := s.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var emailAddr, name string
		if err := rows.Scan(&emailAddr, &name); err != nil {
			continue
		}
		count++
		if s.email != nil {
			body := fmt.Sprintf(`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2 style="margin:0 0 8px">Corridor Product Update</h2><p>Hi %s,</p><p>%s</p><p style="margin-top:18px;color:#475569">You are receiving this because you joined the Corridor waitlist.</p></div>`, html.EscapeString(strings.TrimSpace(name)), strings.ReplaceAll(html.EscapeString(message), "\n", "<br/>"))
			_ = s.email.Send(emailAddr, subject, body)
		}
	}

	_, _ = s.db.Pool.Exec(ctx, `
		INSERT INTO waitlist_campaigns (created_by, subject, message, recipient_count)
		VALUES ($1,$2,$3,$4)
	`, actorID, subject, message, count)
	_, _ = s.db.Pool.Exec(ctx, `UPDATE waitlist_entries SET last_contacted_at = NOW(), updated_at = NOW()`)
	return count, nil
}
