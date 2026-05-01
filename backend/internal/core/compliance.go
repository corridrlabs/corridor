package core

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ConsentType represents the type of consent being granted/withdrawn
type ConsentType string

const (
	ConsentTypeTOS         ConsentType = "terms_of_service"
	ConsentTypePrivacy     ConsentType = "privacy_policy"
	ConsentTypeMarketing   ConsentType = "marketing_communications"
	ConsentTypeDataSharing ConsentType = "data_sharing"
	ConsentTypeKYC         ConsentType = "kyc_verification"
	ConsentTypeCrossBorder ConsentType = "cross_border_transfer"
)

// DataSubjectRequestType represents the type of data subject request
type DataSubjectRequestType string

const (
	DSARAccess        DataSubjectRequestType = "ACCESS"
	DSARRectification DataSubjectRequestType = "RECTIFICATION"
	DSARErasure       DataSubjectRequestType = "ERASURE"
	DSARPortability   DataSubjectRequestType = "PORTABILITY"
)

// ConsentRecord represents a consent ledger entry
type ConsentRecord struct {
	ID          uuid.UUID  `json:"id"`
	AccountID   uuid.UUID  `json:"account_id"`
	Type        string     `json:"consent_type"`
	Version     string     `json:"version"`
	Granted     bool       `json:"granted"`
	GrantedAt   time.Time  `json:"granted_at"`
	WithdrawnAt *time.Time `json:"withdrawn_at,omitempty"`
	IPAddress   string     `json:"ip_address,omitempty"`
	UserAgent   string     `json:"user_agent,omitempty"`
}

// DataSubjectRequest represents a data subject access/erasure request
type DataSubjectRequest struct {
	ID          uuid.UUID              `json:"id"`
	AccountID   uuid.UUID              `json:"account_id"`
	RequestType string                 `json:"request_type"`
	Status      string                 `json:"status"`
	Payload     map[string]interface{} `json:"payload,omitempty"`
	ReviewedBy  *uuid.UUID             `json:"reviewed_by,omitempty"`
	Notes       string                 `json:"notes,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// RetentionPolicy represents a data retention policy
type RetentionPolicy struct {
	ID            uuid.UUID  `json:"id"`
	DataCategory  string     `json:"data_category"`
	RetentionDays int        `json:"retention_days"`
	LegalBasis    string     `json:"legal_basis"`
	AutoDelete    bool       `json:"auto_delete"`
	ReviewDate    *time.Time `json:"review_date,omitempty"`
}

// RecordConsent records a consent grant or withdrawal in the ledger
func (s *Service) RecordConsent(ctx context.Context, accountID uuid.UUID, consentType ConsentType, version string, granted bool, ipAddress, userAgent string, metadata map[string]interface{}) error {
	if accountID == uuid.Nil {
		return fmt.Errorf("account_id is required")
	}
	if consentType == "" {
		return fmt.Errorf("consent_type is required")
	}

	// If withdrawing consent, update previous grants
	if !granted {
		now := time.Now()
		_, err := s.db.Pool.Exec(ctx, `
			UPDATE consent_ledger
			SET withdrawn_at = $1
			WHERE account_id = $2 AND consent_type = $3 AND withdrawn_at IS NULL
		`, now, accountID, string(consentType))
		if err != nil {
			log.Printf("WARNING: Failed to withdraw previous consent: %v", err)
		}
	}

	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO consent_ledger (account_id, consent_type, version, granted, ip_address, user_agent, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
	`, accountID, string(consentType), version, granted, ipAddress, userAgent, jsonbString(metadata))

	return err
}

// HasConsent checks if an account has granted a specific consent type
func (s *Service) HasConsent(ctx context.Context, accountID uuid.UUID, consentType ConsentType) (bool, error) {
	var granted bool
	var withdrawnAt *time.Time
	err := s.db.Pool.QueryRow(ctx, `
		SELECT granted, withdrawn_at
		FROM consent_ledger
		WHERE account_id = $1 AND consent_type = $2
		ORDER BY granted_at DESC
		LIMIT 1
	`, accountID, string(consentType)).Scan(&granted, &withdrawnAt)

	if err != nil {
		return false, nil // No consent record found, treat as not granted
	}

	return granted && withdrawnAt == nil, nil
}

// HasRequiredConsents checks whether an account has accepted the core legal terms required to use the app.
func (s *Service) HasRequiredConsents(ctx context.Context, accountID uuid.UUID) (bool, error) {
	terms, err := s.HasConsent(ctx, accountID, ConsentTypeTOS)
	if err != nil {
		return false, err
	}
	privacy, err := s.HasConsent(ctx, accountID, ConsentTypePrivacy)
	if err != nil {
		return false, err
	}
	return terms && privacy, nil
}

// loadConsentSnapshotBestEffort returns the latest known consent flags without
// letting a missing consent ledger break authentication or profile reads.
func (s *Service) loadConsentSnapshotBestEffort(ctx context.Context, accountID uuid.UUID) (bool, bool, bool) {
	var ledgerExists bool
	if err := s.db.Pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.tables
			WHERE table_schema = current_schema()
			  AND table_name = 'consent_ledger'
		)
	`).Scan(&ledgerExists); err != nil || !ledgerExists {
		return false, false, false
	}

	terms, err := s.HasConsent(ctx, accountID, ConsentTypeTOS)
	if err != nil {
		return false, false, false
	}
	privacy, err := s.HasConsent(ctx, accountID, ConsentTypePrivacy)
	if err != nil {
		return false, false, false
	}
	kyc, err := s.HasConsent(ctx, accountID, ConsentTypeKYC)
	if err != nil {
		return false, false, false
	}
	return terms, privacy, kyc
}

// GetConsentSnapshot returns the current legal acceptance state for an account.
func (s *Service) GetConsentSnapshot(ctx context.Context, accountID uuid.UUID) (bool, bool, bool, error) {
	terms, err := s.HasConsent(ctx, accountID, ConsentTypeTOS)
	if err != nil {
		return false, false, false, err
	}
	privacy, err := s.HasConsent(ctx, accountID, ConsentTypePrivacy)
	if err != nil {
		return false, false, false, err
	}
	kyc, err := s.HasConsent(ctx, accountID, ConsentTypeKYC)
	if err != nil {
		return false, false, false, err
	}
	return terms, privacy, kyc, nil
}

// CreateDataSubjectRequest creates a new DSAR (Access, Rectification, Erasure, Portability)
func (s *Service) CreateDataSubjectRequest(ctx context.Context, accountID uuid.UUID, requestType DataSubjectRequestType, payload map[string]interface{}) (*DataSubjectRequest, error) {
	var id uuid.UUID
	var createdAt, updatedAt time.Time
	var payloadJSON []byte
	if payload != nil {
		payloadJSON, _ = json.Marshal(payload)
	}

	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO data_subject_requests (account_id, request_type, payload)
		VALUES ($1, $2, $3::jsonb)
		RETURNING id, created_at, updated_at
	`, accountID, string(requestType), string(payloadJSON)).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create DSAR: %w", err)
	}

	return &DataSubjectRequest{
		ID:          id,
		AccountID:   accountID,
		RequestType: string(requestType),
		Status:      "PENDING",
		Payload:     payload,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}, nil
}

// GetDataSubjectRequest retrieves a DSAR by ID (for the requesting account or admin)
func (s *Service) GetDataSubjectRequest(ctx context.Context, requestID, accountID uuid.UUID, isAdmin bool) (*DataSubjectRequest, error) {
	query := `
		SELECT id, account_id, request_type, status, payload, reviewed_by, notes, created_at, updated_at
		FROM data_subject_requests
		WHERE id = $1
	`
	args := []interface{}{requestID}
	if !isAdmin {
		query += " AND account_id = $2"
		args = append(args, accountID)
	}

	var req DataSubjectRequest
	var payloadJSON []byte
	err := s.db.Pool.QueryRow(ctx, query, args...).Scan(
		&req.ID, &req.AccountID, &req.RequestType, &req.Status, &payloadJSON, &req.ReviewedBy, &req.Notes, &req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if len(payloadJSON) > 0 {
		_ = json.Unmarshal(payloadJSON, &req.Payload)
	}

	return &req, nil
}

// ReviewDataSubjectRequest reviews and updates a DSAR (admin only)
func (s *Service) ReviewDataSubjectRequest(ctx context.Context, requestID, reviewerID uuid.UUID, status string, notes string) error {
	now := time.Now()
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE data_subject_requests
		SET status = $1, reviewed_by = $2, notes = $3, reviewed_at = $4, updated_at = NOW()
		WHERE id = $5
	`, status, reviewerID, notes, now, requestID)

	if err != nil {
		return fmt.Errorf("failed to review DSAR: %w", err)
	}

	// Audit log the action
	_ = s.RecordAuditLog(ctx, reviewerID, "dsar_reviewed", "data_subject_request", requestID.String(), map[string]interface{}{
		"status": status,
		"notes":  notes,
	}, "", "")

	return nil
}

// GetRetentionPolicies retrieves all data retention policies
func (s *Service) GetRetentionPolicies(ctx context.Context) ([]RetentionPolicy, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, data_category, retention_days, legal_basis, auto_delete, review_date
		FROM data_retention_policies
		ORDER BY data_category
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var policies []RetentionPolicy
	for rows.Next() {
		var p RetentionPolicy
		if err := rows.Scan(&p.ID, &p.DataCategory, &p.RetentionDays, &p.LegalBasis, &p.AutoDelete, &p.ReviewDate); err != nil {
			return nil, err
		}
		policies = append(policies, p)
	}
	return policies, nil
}

// RunRetentionCleanup runs automated deletion based on retention policies (to be called by a cron job)
func (s *Service) RunRetentionCleanup(ctx context.Context) (map[string]int, error) {
	results := make(map[string]int)

	policies, err := s.GetRetentionPolicies(ctx)
	if err != nil {
		return nil, err
	}

	for _, policy := range policies {
		if !policy.AutoDelete {
			continue
		}

		cutoffDate := time.Now().AddDate(0, 0, -policy.RetentionDays)
		var deleted int

		// Apply retention based on category
		switch policy.DataCategory {
		case "kyc_documents":
			// Don't auto-delete KYC documents - need manual review for AML
			continue
		case "waitlist_entries":
			err := s.db.Pool.QueryRow(ctx, `
				WITH deleted AS (
					DELETE FROM waitlist_entries
					WHERE created_at < $1 AND status != 'PENDING'
					RETURNING id
				) SELECT COUNT(*) FROM deleted
			`, cutoffDate).Scan(&deleted)
			if err == nil {
				results[policy.DataCategory] = deleted
			}
		case "session_tokens":
			// Clean up expired JWT tokens from audit logs (keep metadata only)
			err := s.db.Pool.QueryRow(ctx, `
				WITH deleted AS (
					DELETE FROM system_audit_logs
					WHERE created_at < $1 AND action = 'login'
					RETURNING id
				) SELECT COUNT(*) FROM deleted
			`, cutoffDate).Scan(&deleted)
			if err == nil {
				results[policy.DataCategory] = deleted
			}
		}

		log.Printf("Retention cleanup: deleted %d records from %s (older than %s)", deleted, policy.DataCategory, cutoffDate)
	}

	return results, nil
}

// SanctionsScreeningStub is a stub for sanctions/PEP screening integration
// In production, integrate with: WorldCheck, Refinitiv, Sanctions.io, OFAC list
func (s *Service) SanctionsScreeningStub(ctx context.Context, accountID uuid.UUID, name, country, documentNumber string) (bool, string, error) {
	// TODO: Replace with actual sanctions screening API call
	// This is a stub that always returns clean (false = no match)
	// Example integration:
	// - WorldCheck One API (Refinitiv)
	// - Sanctions.io API
	// - OFAC list download and local search
	// - UN Security Council sanctions list

	log.Printf("SANCTIONS STUB: Screening account %s, name=%s, country=%s", accountID, name, country)

	// Audit log the screening attempt
	_ = s.RecordAuditLog(ctx, accountID, "sanctions_screening", "account", accountID.String(), map[string]interface{}{
		"name":            name,
		"country":         country,
		"document_number": documentNumber,
		"result":          "clean_stub",
	}, "", "")

	return false, "", nil // false = no sanctions match
}

// TransactionMonitoringHook is a hook for monitoring transactions for suspicious activity
// To be called after transaction creation/completion
func (s *Service) TransactionMonitoringHook(ctx context.Context, transactionID uuid.UUID, amount float64, currency, senderID, recipientID string) error {
	// TODO: Implement transaction monitoring rules
	// FATF Red Flag indicators:
	// - Rapid movement of funds (3+ transactions in 24h)
	// - Large amounts (>threshold based on corridor)
	// - Cross-border to high-risk jurisdictions
	// - Structuring (breaking large amounts into smaller ones)
	// - Round-tripping (same amount sent back and forth)

	log.Printf("TX MONITOR: Checking transaction %s for suspicious activity", transactionID)

	// Get recent transaction count for sender
	var recentTxCount int
	err := s.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM transactions t
		JOIN wallets w ON w.id = t.sender_wallet_id
		WHERE w.account_id = $1
		  AND t.created_at > NOW() - INTERVAL '24 hours'
		  AND t.status = 'COMPLETED'
	`, senderID).Scan(&recentTxCount)

	if err == nil && recentTxCount > 10 {
		// Potential rapid movement - flag for review
		_ = s.RecordAuditLog(ctx, uuid.Nil, "suspicious_activity_flag", "transaction", transactionID.String(), map[string]interface{}{
			"reason":       "rapid_movement_24h",
			"tx_count_24h": recentTxCount,
			"amount":       amount,
			"currency":     currency,
		}, "", "")

		// TODO: Send alert to compliance team
		// TODO: Create SAR (Suspicious Activity Report) draft
	}

	// Check for high-value transaction
	if amount > 10000 {
		_ = s.RecordAuditLog(ctx, uuid.Nil, "high_value_tx_flag", "transaction", transactionID.String(), map[string]interface{}{
			"reason":    "high_value_threshold",
			"amount":    amount,
			"currency":  currency,
			"threshold": 10000,
		}, "", "")

		// TODO: Enhanced Due Diligence (EDD) check
	}

	return nil
}

// CheckPCICompliance verifies no cardholder data is stored in Corridor systems
// Should be called periodically or before PCI DSS audit
func (s *Service) CheckPCICompliance(ctx context.Context) ([]string, error) {
	var issues []string

	// Check if any table contains potential card numbers (simplified check)
	// Real PCI DSS compliance requires:
	// 1. No full PAN storage (only last 4 digits allowed)
	// 2. No CVV/CVC storage (ever)
	// 3. Encrypted storage of card data if tokenized
	// 4. Access logging for any card data access

	// Check transactions table for potential PAN patterns
	var panCount int
	err := s.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM transactions
		WHERE context::text ~ '[0-9]{13,19}'
		   OR message ~ '[0-9]{13,19}'
	`).Scan(&panCount)

	if err == nil && panCount > 0 {
		issues = append(issues, fmt.Sprintf("Potential card numbers found in transactions: %d records", panCount))
	}

	// Check accounts table
	var cardDataCount int
	err = s.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM accounts
		WHERE settings::text ~ '[0-9]{13,19}'
	`).Scan(&cardDataCount)

	if err == nil && cardDataCount > 0 {
		issues = append(issues, fmt.Sprintf("Potential card data in account settings: %d records", cardDataCount))
	}

	if len(issues) == 0 {
		log.Println("PCI COMPLIANCE CHECK: No cardholder data detected in database")
	} else {
		log.Printf("PCI COMPLIANCE CHECK: Found %d potential issues", len(issues))
	}

	return issues, nil
}

// GetAccountDataExport exports all personal data for a user (GDPR Art. 20, Kenya DPA s38)
func (s *Service) GetAccountDataExport(ctx context.Context, accountID uuid.UUID) (map[string]interface{}, error) {
	export := make(map[string]interface{})

	// Get account details
	acc, err := s.GetAccountByID(ctx, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}
	export["account"] = acc

	// Get wallets
	wallets, err := s.GetWallets(ctx, accountID)
	if err == nil {
		export["wallets"] = wallets
	}

	// Get KYC submissions
	kycSubmissions, err := s.ListKYCSubmissions(ctx, accountID, false)
	if err == nil {
		export["kyc_submissions"] = kycSubmissions
	}

	// Get transactions (last 100)
	// TODO: Get transaction history

	// Get consent records
	var consentRows []map[string]interface{}
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, consent_type, version, granted, granted_at, withdrawn_at, ip_address
		FROM consent_ledger
		WHERE account_id = $1
		ORDER BY granted_at DESC
	`, accountID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var c map[string]interface{}
			var id uuid.UUID
			var consentType, version, ipAddress string
			var granted bool
			var grantedAt time.Time
			var withdrawnAt *time.Time
			if err := rows.Scan(&id, &consentType, &version, &granted, &grantedAt, &withdrawnAt, &ipAddress); err == nil {
				c = map[string]interface{}{
					"id":           id,
					"consent_type": consentType,
					"version":      version,
					"granted":      granted,
					"granted_at":   grantedAt,
					"withdrawn_at": withdrawnAt,
					"ip_address":   ipAddress,
				}
				consentRows = append(consentRows, c)
			}
		}
		export["consent_records"] = consentRows
	}

	// Get audit logs (last 30 days)
	var auditRows []map[string]interface{}
	auditRowsResult, err := s.db.Pool.Query(ctx, `
		SELECT id, action, entity_type, entity_id, metadata, created_at
		FROM system_audit_logs
		WHERE actor_id = $1 AND created_at > NOW() - INTERVAL '30 days'
		ORDER BY created_at DESC
		LIMIT 100
	`, accountID)
	if err == nil {
		defer auditRowsResult.Close()
		for auditRowsResult.Next() {
			var a map[string]interface{}
			var id uuid.UUID
			var action, entityType, entityID string
			var metadataJSON []byte
			var createdAt time.Time
			if err := auditRowsResult.Scan(&id, &action, &entityType, &entityID, &metadataJSON, &createdAt); err == nil {
				a = map[string]interface{}{
					"id":          id,
					"action":      action,
					"entity_type": entityType,
					"entity_id":   entityID,
					"created_at":  createdAt,
				}
				var metadata map[string]interface{}
				if len(metadataJSON) > 0 {
					_ = json.Unmarshal(metadataJSON, &metadata)
					a["metadata"] = metadata
				}
				auditRows = append(auditRows, a)
			}
		}
		export["audit_logs_30d"] = auditRows
	}

	export["exported_at"] = time.Now()
	export["data_protection_notice"] = "This export contains your personal data as required by GDPR Art. 20 and Kenya DPA s38"

	return export, nil
}

// GetDBPool returns the database pool for compliance queries
func (s *Service) GetDBPool() *pgxpool.Pool {
	return s.db.Pool
}

// DeleteAccountData handles account deletion with grace period (GDPR Art. 17, Kenya DPA s40)
// Returns grace period end date for final deletion
func (s *Service) DeleteAccountData(ctx context.Context, accountID uuid.UUID, requestedBy uuid.UUID) (time.Time, error) {
	// Grace period: 30 days for potential legal holds or transaction disputes
	gracePeriodEnd := time.Now().AddDate(0, 0, 30)

	// Mark account for deletion (don't delete immediately)
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE accounts
		SET account_status = 'PENDING_DELETION',
		    settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{deletion_requested_at}', to_jsonb(NOW()::text)),
		    updated_at = NOW()
		WHERE id = $1
	`, accountID)
	if err != nil {
		return gracePeriodEnd, fmt.Errorf("failed to mark account for deletion: %w", err)
	}

	// Audit log
	_ = s.RecordAuditLog(ctx, requestedBy, "account_deletion_requested", "account", accountID.String(), map[string]interface{}{
		"grace_period_end": gracePeriodEnd,
		"legal_basis":      "GDPR Art. 17 / Kenya DPA s40 - Right to erasure",
	}, "", "")

	// TODO: Send confirmation email to user
	// TODO: Notify compliance team for final review
	// TODO: After grace period, actually delete:
	// - Anonymize transaction records (keep for AML - POCA s36B)
	// - Delete KYC documents (after AML retention period)
	// - Delete account record

	return gracePeriodEnd, nil
}

// VerifyKYCWithDocument performs additional KYC verification beyond status flag
// Integrates with document verification services (Jumio, Onfido, Stripe Identity)
func (s *Service) VerifyKYCWithDocument(ctx context.Context, accountID uuid.UUID, documentURL, verificationProvider string) error {
	// TODO: Integrate with actual KYC verification provider
	// - Jumio Netverify
	// - Onfido
	// - Stripe Identity
	// - Smile Identity (for Africa)

	log.Printf("KYC VERIFICATION STUB: account=%s, provider=%s", accountID, verificationProvider)

	// Update KYC status to under_review
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE accounts
		SET kyc_status = 'UNDER_REVIEW',
		    settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{kyc_verification_provider}', to_jsonb($1::text)),
		    updated_at = NOW()
		WHERE id = $2
	`, verificationProvider, accountID)

	if err != nil {
		return fmt.Errorf("failed to update KYC status: %w", err)
	}

	// Audit log
	_ = s.RecordAuditLog(ctx, accountID, "kyc_verification_started", "account", accountID.String(), map[string]interface{}{
		"verification_provider": verificationProvider,
		"document_url":          documentURL,
	}, "", "")

	return nil
}
