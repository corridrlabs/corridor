package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/google/uuid"
)

// handleCreateDSAR handles data subject access/erasure/portability requests
func (h *Handler) handleCreateDSAR(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		RequestType string                 `json:"request_type"` // ACCESS, RECTIFICATION, ERASURE, PORTABILITY
		Payload     map[string]interface{} `json:"payload,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	input.RequestType = strings.ToUpper(strings.TrimSpace(input.RequestType))
	if input.RequestType == "" {
		http.Error(w, "request_type is required", http.StatusBadRequest)
		return
	}

	dsar, err := h.svc.CreateDataSubjectRequest(r.Context(), accountID, core.DataSubjectRequestType(input.RequestType), input.Payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit log
	_ = h.svc.RecordAuditLog(r.Context(), accountID, "dsar_created", "data_subject_request", dsar.ID.String(), map[string]interface{}{
		"request_type": input.RequestType,
	}, getIPAddress(r), r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dsar)
}

// handleGetDSAR retrieves a data subject request
func (h *Handler) handleGetDSAR(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	requestIDStr := r.URL.Query().Get("id")
	requestID, err := uuid.Parse(requestIDStr)
	if err != nil {
		http.Error(w, "invalid request id", http.StatusBadRequest)
		return
	}

	isAdmin := false
	acc, _ := h.svc.GetAccountByID(r.Context(), accountID)
	if acc != nil && acc.IsAdmin() {
		isAdmin = true
	}

	dsar, err := h.svc.GetDataSubjectRequest(r.Context(), requestID, accountID, isAdmin)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dsar)
}

// handleListDSARs lists data subject requests for current user
func (h *Handler) handleListDSARs(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Get from database using service method
	rows, err := h.svc.GetDBPool().Query(r.Context(), `
		SELECT id, request_type, status, payload, reviewed_by, notes, created_at, updated_at
		FROM data_subject_requests
		WHERE account_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []map[string]interface{}
	for rows.Next() {
		var req struct {
			ID          uuid.UUID
			RequestType string
			Status      string
			Payload     []byte
			ReviewedBy  *uuid.UUID
			Notes       string
			CreatedAt   string
			UpdatedAt   string
		}
		if err := rows.Scan(&req.ID, &req.RequestType, &req.Status, &req.Payload, &req.ReviewedBy, &req.Notes, &req.CreatedAt, &req.UpdatedAt); err != nil {
			continue
		}
		requests = append(requests, map[string]interface{}{
			"id":           req.ID.String(),
			"request_type": req.RequestType,
			"status":       req.Status,
			"reviewed_by":  req.ReviewedBy,
			"notes":        req.Notes,
			"created_at":   req.CreatedAt,
			"updated_at":   req.UpdatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"items": requests,
	})
}

// handleExportMyData handles GDPR/API data portability request
func (h *Handler) handleExportMyData(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Create DSAR for audit trail
	_, _ = h.svc.CreateDataSubjectRequest(r.Context(), accountID, core.DSARAccess, nil)

	export, err := h.svc.GetAccountDataExport(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit log
	_ = h.svc.RecordAuditLog(r.Context(), accountID, "data_exported", "account", accountID.String(), map[string]interface{}{
		"export_type": "full_data_portability",
	}, getIPAddress(r), r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=\"my_data_export.json\"")
	json.NewEncoder(w).Encode(export)
}

// handleDeleteMyData handles GDPR erasure request
func (h *Handler) handleDeleteMyData(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Create DSAR for audit trail
	dsar, err := h.svc.CreateDataSubjectRequest(r.Context(), accountID, core.DSARErasure, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	gracePeriodEnd, err := h.svc.DeleteAccountData(r.Context(), accountID, accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit log
	_ = h.svc.RecordAuditLog(r.Context(), accountID, "deletion_requested", "account", accountID.String(), map[string]interface{}{
		"dsar_id":          dsar.ID.String(),
		"grace_period_end": gracePeriodEnd,
		"legal_basis":      "GDPR Art. 17 / Kenya DPA s40",
	}, getIPAddress(r), r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":          "Deletion request submitted. Account will be deleted after grace period.",
		"grace_period_end": gracePeriodEnd,
		"dsar_id":          dsar.ID.String(),
	})
}

// handleGrantConsent handles consent grant/withdrawal
func (h *Handler) handleGrantConsent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		ConsentType string `json:"consent_type"`
		Version     string `json:"version"`
		Granted     bool   `json:"granted"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	input.ConsentType = strings.TrimSpace(input.ConsentType)
	if input.ConsentType == "" {
		http.Error(w, "consent_type is required", http.StatusBadRequest)
		return
	}

	err := h.svc.RecordConsent(r.Context(), accountID, core.ConsentType(input.ConsentType), input.Version, input.Granted, getIPAddress(r), r.UserAgent(), nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit log
	_ = h.svc.RecordAuditLog(r.Context(), accountID, "consent_updated", "consent_ledger", accountID.String(), map[string]interface{}{
		"consent_type": input.ConsentType,
		"granted":      input.Granted,
		"version":      input.Version,
	}, getIPAddress(r), r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"message": func() string {
			if input.Granted {
				return "Consent granted"
			}
			return "Consent withdrawn"
		}(),
	})
}

// handleGetConsents retrieves all consents for current user
func (h *Handler) handleGetConsents(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := h.svc.GetDB().Pool.Query(r.Context(), `
		SELECT id, consent_type, version, granted, granted_at, withdrawn_at
		FROM consent_ledger
		WHERE account_id = $1
		ORDER BY granted_at DESC
	`, accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var consents []map[string]interface{}
	for rows.Next() {
		var c struct {
			ID          uuid.UUID
			ConsentType string
			Version     string
			Granted     bool
			GrantedAt   string
			WithdrawnAt *string
		}
		if err := rows.Scan(&c.ID, &c.ConsentType, &c.Version, &c.Granted, &c.GrantedAt, &c.WithdrawnAt); err != nil {
			continue
		}
		consents = append(consents, map[string]interface{}{
			"id":           c.ID.String(),
			"consent_type": c.ConsentType,
			"version":      c.Version,
			"granted":      c.Granted,
			"granted_at":   c.GrantedAt,
			"withdrawn_at": c.WithdrawnAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"consents": consents,
	})
}

// handleCheckPCICompliance runs PCI DSS compliance check (admin only)
func (h *Handler) handleCheckPCICompliance(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil || !acc.IsAdmin() {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	issues, err := h.svc.CheckPCICompliance(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit log
	_ = h.svc.RecordAuditLog(r.Context(), accountID, "pci_compliance_check", "system", "", map[string]interface{}{
		"issues_found": len(issues),
	}, getIPAddress(r), r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"compliant": len(issues) == 0,
		"issues":    issues,
		"note":      "This is a basic check. Full PCI DSS v4.0.1 compliance requires external QSA audit.",
	})
}

// handleGetRetentionPolicies lists data retention policies (admin or user)
func (h *Handler) handleGetRetentionPolicies(w http.ResponseWriter, r *http.Request) {
	policies, err := h.svc.GetRetentionPolicies(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"policies": policies,
	})
}

// handleScreenUserSanctions triggers sanctions screening for a user (admin or self)
func (h *Handler) handleScreenUserSanctions(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var targetAccountID uuid.UUID = accountID
	if r.URL.Query().Get("account_id") != "" {
		// Admin can screen other users
		acc, err := h.svc.GetAccountByID(r.Context(), accountID)
		if err != nil || !acc.IsAdmin() {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		targetAccountID, _ = uuid.Parse(r.URL.Query().Get("account_id"))
	}

	acc, err := h.svc.GetAccountByID(r.Context(), targetAccountID)
	if err != nil {
		http.Error(w, "account not found", http.StatusNotFound)
		return
	}

	hasMatch, details, err := h.svc.SanctionsScreeningStub(r.Context(), targetAccountID, acc.FullName, acc.Country, "")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"account_id":    targetAccountID.String(),
		"sanctions_hit": hasMatch,
		"details":       details,
		"note":          "This is a stub. Integrate with WorldCheck, Sanctions.io, or OFAC list for production.",
	})
}

// handleRunRetentionCleanup triggers data retention cleanup (admin only)
func (h *Handler) handleRunRetentionCleanup(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil || !acc.IsAdmin() {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	results, err := h.svc.RunRetentionCleanup(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit log
	_ = h.svc.RecordAuditLog(r.Context(), accountID, "retention_cleanup_executed", "system", "", map[string]interface{}{
		"results": results,
	}, getIPAddress(r), r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "completed",
		"results": results,
	})
}

// handleVerifyKYC triggers KYC verification with document (stub for Jumio/Onfido/Stripe Identity)
func (h *Handler) handleVerifyKYC(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		DocumentURL          string `json:"document_url"`
		VerificationProvider string `json:"verification_provider"` // jumio, onfido, stripe_identity, smile_identity
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.VerifyKYCWithDocument(r.Context(), accountID, input.DocumentURL, input.VerificationProvider)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit log
	_ = h.svc.RecordAuditLog(r.Context(), accountID, "kyc_verification_started", "account", accountID.String(), map[string]interface{}{
		"verification_provider": input.VerificationProvider,
		"document_url":          input.DocumentURL,
	}, getIPAddress(r), r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "verification_started",
		"message": "KYC verification initiated. You will be notified when complete.",
		"note":    "This is a stub. Integrate with Jumio, Onfido, Stripe Identity, or Smile Identity for production.",
	})
}
