package core

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type KYCSubmission struct {
	ID         uuid.UUID                `json:"id"`
	AccountID  uuid.UUID                `json:"account_id"`
	Documents  []map[string]interface{} `json:"documents"`
	Status     string                   `json:"status"`
	ReviewerID *uuid.UUID               `json:"reviewer_id,omitempty"`
	Notes      string                   `json:"notes,omitempty"`
	CreatedAt  time.Time                `json:"created_at"`
	ReviewedAt *time.Time               `json:"reviewed_at,omitempty"`
}

type KYCDocumentInput struct {
	DocumentType string
	FileName     string
	MimeType     string
	SizeBytes    int64
	Data         []byte
	SourceURL    string
}

type KYCDocumentRecord struct {
	ID           uuid.UUID
	SubmissionID uuid.UUID
	AccountID    uuid.UUID
	DocumentType string
	FileName     string
	MimeType     string
	FileSize     int64
	FileData     []byte
	CreatedAt    time.Time
}

// SubmitKYC submits KYC documents for review.
func (s *Service) SubmitKYC(ctx context.Context, accountID uuid.UUID, documents []KYCDocumentInput, notes string) (*KYCSubmission, error) {
	if len(documents) == 0 {
		return nil, fmt.Errorf("at least one KYC document is required")
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start KYC transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var submissionID uuid.UUID
	var createdAt time.Time
	if err := tx.QueryRow(ctx, `
		INSERT INTO kyc_submissions (account_id, documents, notes)
		VALUES ($1, '[]'::jsonb, $2)
		RETURNING id, created_at
	`, accountID, notes).Scan(&submissionID, &createdAt); err != nil {
		return nil, fmt.Errorf("failed to create KYC submission: %w", err)
	}

	documentMetadata := make([]map[string]interface{}, 0, len(documents))
	for _, doc := range documents {
		meta := map[string]interface{}{
			"document_type": doc.DocumentType,
			"file_name":     doc.FileName,
			"mime_type":     doc.MimeType,
			"size_bytes":    doc.SizeBytes,
		}

		if strings.TrimSpace(doc.SourceURL) != "" {
			meta["source_url"] = strings.TrimSpace(doc.SourceURL)
			documentMetadata = append(documentMetadata, meta)
			continue
		}

		if len(doc.Data) == 0 {
			continue
		}

		var documentID uuid.UUID
		var uploadedAt time.Time
		if err := tx.QueryRow(ctx, `
			INSERT INTO kyc_documents (
				submission_id, account_id, document_type, file_name, mime_type, file_size, file_data
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, created_at
		`, submissionID, accountID, doc.DocumentType, doc.FileName, doc.MimeType, doc.SizeBytes, doc.Data).Scan(&documentID, &uploadedAt); err != nil {
			return nil, fmt.Errorf("failed to store KYC document: %w", err)
		}

		meta["id"] = documentID.String()
		meta["download_url"] = fmt.Sprintf("/api/kyc/documents?id=%s", documentID.String())
		meta["uploaded_at"] = uploadedAt
		documentMetadata = append(documentMetadata, meta)
	}

	if len(documentMetadata) == 0 {
		return nil, fmt.Errorf("at least one valid KYC document is required")
	}

	docsJSON, err := json.Marshal(documentMetadata)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal KYC document metadata: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE kyc_submissions
		SET documents = $1
		WHERE id = $2
	`, docsJSON, submissionID); err != nil {
		return nil, fmt.Errorf("failed to update KYC submission documents: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit KYC submission: %w", err)
	}

	return &KYCSubmission{
		ID:        submissionID,
		AccountID: accountID,
		Documents: documentMetadata,
		Status:    "pending",
		Notes:     notes,
		CreatedAt: createdAt,
	}, nil
}

// ListKYCSubmissions retrieves all KYC submissions for a user or the full admin queue.
func (s *Service) ListKYCSubmissions(ctx context.Context, accountID uuid.UUID, isAdmin bool) ([]KYCSubmission, error) {
	query := `
		SELECT id, account_id, documents, status, reviewer_id, COALESCE(notes, ''), created_at, reviewed_at
		FROM kyc_submissions
	`
	args := []interface{}{}
	if !isAdmin {
		query += ` WHERE account_id = $1`
		args = append(args, accountID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := s.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var submissions []KYCSubmission
	for rows.Next() {
		var sub KYCSubmission
		var docsJSON []byte
		if err := rows.Scan(&sub.ID, &sub.AccountID, &docsJSON, &sub.Status, &sub.ReviewerID, &sub.Notes, &sub.CreatedAt, &sub.ReviewedAt); err != nil {
			return nil, err
		}
		if len(docsJSON) > 0 {
			if err := json.Unmarshal(docsJSON, &sub.Documents); err != nil {
				return nil, fmt.Errorf("failed to parse KYC document metadata: %w", err)
			}
		} else {
			sub.Documents = []map[string]interface{}{}
		}
		submissions = append(submissions, sub)
	}

	return submissions, nil
}

// GetKYCDocument returns a stored KYC PDF/document for the owning account or an admin.
func (s *Service) GetKYCDocument(ctx context.Context, documentID, accountID uuid.UUID, isAdmin bool) (*KYCDocumentRecord, error) {
	query := `
		SELECT id, submission_id, account_id, document_type, file_name, mime_type, file_size, file_data, created_at
		FROM kyc_documents
		WHERE id = $1
	`
	args := []interface{}{documentID}
	if !isAdmin {
		query += ` AND account_id = $2`
		args = append(args, accountID)
	}

	var doc KYCDocumentRecord
	if err := s.db.Pool.QueryRow(ctx, query, args...).Scan(
		&doc.ID,
		&doc.SubmissionID,
		&doc.AccountID,
		&doc.DocumentType,
		&doc.FileName,
		&doc.MimeType,
		&doc.FileSize,
		&doc.FileData,
		&doc.CreatedAt,
	); err != nil {
		return nil, err
	}

	return &doc, nil
}

// ReviewKYC reviews a KYC submission.
func (s *Service) ReviewKYC(ctx context.Context, submissionID, reviewerID uuid.UUID, status, notes string) error {
	now := time.Now()
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE kyc_submissions
		SET status = $1, reviewer_id = $2, notes = $3, reviewed_at = $4
		WHERE id = $5
	`, status, reviewerID, notes, now, submissionID)

	if err != nil {
		return fmt.Errorf("failed to review KYC: %w", err)
	}

	if status == "approved" {
		_, err = s.db.Pool.Exec(ctx, `
			UPDATE accounts
			SET kyc_status = 'VERIFIED', kyc_level = 2
			WHERE id = (SELECT account_id FROM kyc_submissions WHERE id = $1)
		`, submissionID)
	}

	return err
}
