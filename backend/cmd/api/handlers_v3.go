package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time" // Keep time import as it's used by createInvoice

	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/corridrlabs/corridor/backend/pkg/api"
	"github.com/google/uuid"
)

// ============================================
// CUSTOMERS HANDLERS
// ============================================

func (h *Handler) createCustomer(w http.ResponseWriter, r *http.Request) {
	// Get account ID from token
	accountID := getAccountID(r.Context())

	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	customer, err := h.svc.CreateCustomer(r.Context(), accountID, req.Name, req.Phone, req.Email)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, customer)
}

func (h *Handler) getCustomers(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	customers, err := h.svc.GetCustomers(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, customers)
}

func (h *Handler) getCustomer(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	// Extract ID from URL path (simple approach)
	customerID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid customer ID")
		return
	}

	customer, err := h.svc.GetCustomer(r.Context(), accountID, customerID)
	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, customer)
}

// ============================================
// INVOICES HANDLERS
// ============================================

func (h *Handler) createInvoice(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var req struct {
		CustomerID string `json:"customer_id"`
		Currency   string `json:"currency"`
		Reference  string `json:"reference"`
		Notes      string `json:"notes"`
		Items      []struct {
			Description string  `json:"description"`
			Qty         int     `json:"qty"`
			UnitPrice   float64 `json:"unit_price"`
		} `json:"items"`
		DueDate string `json:"due_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	customerID, _ := uuid.Parse(req.CustomerID)

	// Convert items
	items := make([]struct {
		Description string
		Qty         int
		UnitPrice   float64
	}, len(req.Items))
	for i, item := range req.Items {
		items[i].Description = item.Description
		items[i].Qty = item.Qty
		items[i].UnitPrice = item.UnitPrice
	}

	dueDate, err := parseInvoiceDueDate(req.DueDate)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	input := core.CreateInvoiceInput{
		CustomerID: customerID,
		Currency:   req.Currency,
		Reference:  req.Reference,
		Notes:      req.Notes,
		Items:      items,
		DueDate:    dueDate,
	}

	invoice, err := h.svc.CreateInvoice(r.Context(), accountID, input)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, invoice)
}

func (h *Handler) updateInvoice(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	invoiceID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	var req struct {
		CustomerID string `json:"customer_id"`
		Currency   string `json:"currency"`
		Reference  string `json:"reference"`
		Notes      string `json:"notes"`
		Items      []struct {
			Description string  `json:"description"`
			Qty         int     `json:"qty"`
			UnitPrice   float64 `json:"unit_price"`
		} `json:"items"`
		DueDate string `json:"due_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	customerID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid customer ID")
		return
	}

	items := make([]struct {
		Description string
		Qty         int
		UnitPrice   float64
	}, len(req.Items))
	for i, item := range req.Items {
		items[i].Description = item.Description
		items[i].Qty = item.Qty
		items[i].UnitPrice = item.UnitPrice
	}

	dueDate, err := parseInvoiceDueDate(req.DueDate)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	input := core.UpdateInvoiceInput{
		CustomerID: customerID,
		Currency:   req.Currency,
		Reference:  req.Reference,
		Notes:      req.Notes,
		Items:      items,
		DueDate:    dueDate,
	}

	invoice, err := h.svc.UpdateInvoice(r.Context(), accountID, invoiceID, input)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, invoice)
}

func (h *Handler) getPublicInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	session := r.URL.Query().Get("session")
	email := strings.TrimSpace(r.URL.Query().Get("email"))
	phone := strings.TrimSpace(r.URL.Query().Get("phone"))

	invoice, err := h.svc.GetPublicInvoice(r.Context(), invoiceID, session, email, phone)
	if err != nil {
		api.RespondWithError(w, http.StatusUnauthorized, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, invoice)
}

func (h *Handler) getInvoices(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	status := r.URL.Query().Get("status")
	invoices, err := h.svc.GetInvoices(r.Context(), accountID, status)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, invoices)
}

func (h *Handler) getInvoice(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	invoiceID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	invoice, err := h.svc.GetInvoice(r.Context(), accountID, invoiceID)
	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, "invoice not found")
		return
	}
	api.RespondWithJSON(w, http.StatusOK, invoice)
}

func (h *Handler) generatePaymentLink(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	invoiceID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "invalid invoice ID", http.StatusBadRequest)
		return
	}

	paymentURL, sessionID, err := h.svc.GeneratePaymentLink(r.Context(), accountID, invoiceID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"payment_url": paymentURL,
		"session_id":  sessionID,
	})
}

func (h *Handler) sendInvoice(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	invoiceID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	if _, err := h.svc.GetInvoice(r.Context(), accountID, invoiceID); err != nil {
		api.RespondWithError(w, http.StatusNotFound, "invoice not found")
		return
	}

	result, err := h.svc.SendInvoice(r.Context(), accountID, invoiceID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":          "invoice sent",
		"delivery":         result,
		"whatsapp_url":     result.WhatsAppURL,
		"email_sent":       result.EmailSent,
		"email_recipient":  result.EmailRecipient,
		"delivery_channel": result.Channel,
	})
}

func (h *Handler) sendInvoiceReminder(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	invoiceID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	if _, err := h.svc.GetInvoice(r.Context(), accountID, invoiceID); err != nil {
		api.RespondWithError(w, http.StatusNotFound, "invoice not found")
		return
	}

	result, err := h.svc.SendReminder(r.Context(), accountID, invoiceID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":          "reminder sent",
		"delivery":         result,
		"whatsapp_url":     result.WhatsAppURL,
		"email_sent":       result.EmailSent,
		"email_recipient":  result.EmailRecipient,
		"delivery_channel": result.Channel,
	})
}

func (h *Handler) deleteInvoice(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	invoiceID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	if err := h.svc.DeleteInvoice(r.Context(), accountID, invoiceID); err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "invoice deleted"})
}

func parseInvoiceDueDate(value string) (*time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}

	layouts := []string{
		time.RFC3339,
		"2006-01-02",
		"2006-01-02T15:04",
	}

	var parsed time.Time
	var err error
	for _, layout := range layouts {
		parsed, err = time.Parse(layout, value)
		if err == nil {
			return &parsed, nil
		}
	}

	return nil, fmt.Errorf("invalid due date format")
}

// ============================================
// KYC HANDLERS
// ============================================

func (h *Handler) submitKYC(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var (
		documents []core.KYCDocumentInput
		notes     string
		err       error
	)

	if strings.Contains(strings.ToLower(r.Header.Get("Content-Type")), "multipart/form-data") {
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		notes = strings.TrimSpace(r.FormValue("notes"))
		documents, err = parseKYCMultipartDocuments(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	} else {
		var req struct {
			Documents []map[string]interface{} `json:"documents"`
			Notes     string                   `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		notes = req.Notes
		documents = normalizeKYCDocuments(req.Documents)
	}

	submission, err := h.svc.SubmitKYC(r.Context(), accountID, documents, notes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	api.RespondWithJSON(w, http.StatusOK, submission)
}

func (h *Handler) listKYCSubmissions(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	submissions, err := h.svc.ListKYCSubmissions(r.Context(), accountID, acc.IsAdmin())
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, submissions)
}

func (h *Handler) getKYCDocument(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	documentID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid document ID")
		return
	}

	doc, err := h.svc.GetKYCDocument(r.Context(), documentID, accountID, acc.IsAdmin())
	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, "document not found")
		return
	}

	filename := doc.FileName
	if filename == "" {
		filename = fmt.Sprintf("%s.pdf", doc.DocumentType)
	}
	if strings.TrimSpace(doc.MimeType) == "" {
		doc.MimeType = "application/pdf"
	}
	w.Header().Set("Content-Type", doc.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filepath.Base(filename)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(doc.FileData)
}

func (h *Handler) reviewKYC(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil || !acc.IsAdmin() {
		api.RespondWithError(w, http.StatusForbidden, "admin access required")
		return
	}

	submissionID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "invalid submission ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = h.svc.ReviewKYC(r.Context(), submissionID, accountID, req.Status, req.Notes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "review submitted"})
}

func parseKYCMultipartDocuments(r *http.Request) ([]core.KYCDocumentInput, error) {
	fileFields := []struct {
		field string
		kind  string
	}{
		{field: "id_document", kind: "government_id"},
		{field: "registration_document", kind: "registration"},
		{field: "proof_of_address_document", kind: "proof_of_address"},
	}

	documents := make([]core.KYCDocumentInput, 0, len(fileFields))
	for _, item := range fileFields {
		file, header, err := r.FormFile(item.field)
		if err != nil {
			if errors.Is(err, http.ErrMissingFile) || strings.Contains(strings.ToLower(err.Error()), "no such file") {
				continue
			}
			return nil, fmt.Errorf("failed to read %s: %w", item.field, err)
		}

		data, err := io.ReadAll(io.LimitReader(file, 12<<20+1))
		file.Close()
		if err != nil {
			return nil, fmt.Errorf("failed to read %s: %w", item.field, err)
		}
		if len(data) == 0 {
			continue
		}
		if len(data) > 12<<20 {
			return nil, fmt.Errorf("%s exceeds the 12MB limit", item.field)
		}

		mimeType := strings.TrimSpace(header.Header.Get("Content-Type"))
		if mimeType == "" || strings.EqualFold(mimeType, "application/octet-stream") {
			mimeType = http.DetectContentType(data)
		}
		if mimeType != "application/pdf" {
			return nil, fmt.Errorf("%s must be a PDF", item.field)
		}

		filename := strings.TrimSpace(header.Filename)
		if filename == "" {
			filename = item.kind + ".pdf"
		}

		documents = append(documents, core.KYCDocumentInput{
			DocumentType: item.kind,
			FileName:     filepath.Base(filename),
			MimeType:     mimeType,
			SizeBytes:    int64(len(data)),
			Data:         data,
		})
	}

	return documents, nil
}

func normalizeKYCDocuments(documents []map[string]interface{}) []core.KYCDocumentInput {
	if len(documents) == 0 {
		return nil
	}

	normalized := make([]core.KYCDocumentInput, 0, len(documents))
	for _, doc := range documents {
		if doc == nil {
			continue
		}

		input := core.KYCDocumentInput{
			DocumentType: firstString(doc, "document_type", "type", "kind"),
			FileName:     firstString(doc, "file_name", "name", "filename"),
			MimeType:     firstString(doc, "mime_type", "mime"),
			SourceURL:    firstString(doc, "source_url", "url", "document_url", "link"),
		}
		if size := firstNumber(doc, "size_bytes", "size"); size > 0 {
			input.SizeBytes = int64(size)
		}
		normalized = append(normalized, input)
	}

	return normalized
}

func firstString(doc map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if raw, ok := doc[key]; ok {
			switch v := raw.(type) {
			case string:
				if strings.TrimSpace(v) != "" {
					return strings.TrimSpace(v)
				}
			}
		}
	}
	return ""
}

func firstNumber(doc map[string]interface{}, keys ...string) float64 {
	for _, key := range keys {
		if raw, ok := doc[key]; ok {
			switch v := raw.(type) {
			case float64:
				return v
			case float32:
				return float64(v)
			case int:
				return float64(v)
			case int64:
				return float64(v)
			case json.Number:
				if parsed, err := v.Float64(); err == nil {
					return parsed
				}
			}
		}
	}
	return 0
}

// ============================================
// API KEYS HANDLERS
// ============================================

func (h *Handler) createAPIKey(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var req struct {
		Name   string `json:"name"`
		IsLive bool   `json:"is_live"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	apiKey, err := h.svc.GenerateAPIKey(r.Context(), accountID, req.Name, req.IsLive)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(apiKey)
}

func (h *Handler) listAPIKeys(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	keys, err := h.svc.ListAPIKeys(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, keys)
}

func (h *Handler) revokeAPIKey(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	keyID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "invalid key ID", http.StatusBadRequest)
		return
	}

	err = h.svc.RevokeAPIKey(r.Context(), accountID, keyID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "key revoked"})
}

// ============================================
// WEBHOOKS HANDLERS
// ============================================

func (h *Handler) createWebhook(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var req struct {
		URL    string   `json:"url"`
		Events []string `json:"events"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	webhook, err := h.svc.CreateWebhook(r.Context(), accountID, req.URL, req.Events)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(webhook)
}

func (h *Handler) listWebhooks(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	webhooks, err := h.svc.ListWebhooks(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, webhooks)
}

func (h *Handler) deleteWebhook(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	webhookID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "invalid webhook ID", http.StatusBadRequest)
		return
	}

	err = h.svc.DeleteWebhook(r.Context(), accountID, webhookID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// ============================================
// BILLING HANDLERS
// ============================================

func (h *Handler) getSubscriptionPlans(w http.ResponseWriter, r *http.Request) {
	plans, err := h.svc.GetSubscriptionPlans(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(plans)
}

func (h *Handler) getUsage(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	usage, err := h.svc.GetUsageStats(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(usage)
}

// ============================================
// GROUP PAYMENTS HANDLER
// ============================================

func (h *Handler) createGroupPayment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Senders     []core.GroupSplitParticipant `json:"senders"`
		Recipients  []core.GroupSplitParticipant `json:"recipients"`
		TotalAmount float64                      `json:"total_amount"`
		Currency    string                       `json:"currency"`
		Message     string                       `json:"message"`
		SplitType   string                       `json:"split_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	input := core.GroupPaymentInput{
		Senders:     req.Senders,
		Recipients:  req.Recipients,
		TotalAmount: req.TotalAmount,
		Currency:    req.Currency,
		Message:     req.Message,
		SplitType:   req.SplitType,
	}

	tx, err := h.svc.CreateGroupPayment(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(tx)
}

// ============================================
// EWA HANDLERS
// ============================================

func (h *Handler) getEWASettings(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	settings, err := h.svc.GetEWASettings(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, settings)
}

func (h *Handler) updateEWASettings(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var settings core.EWASettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := h.svc.UpdateEWASettings(r.Context(), accountID, settings)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, updated)
}

func (h *Handler) createEWAEmployee(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var emp core.EWAEmployee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	created, err := h.svc.CreateEWAEmployee(r.Context(), accountID, emp)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(created)
}

func (h *Handler) getEWAEmployees(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	employees, err := h.svc.GetEWAEmployees(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, employees)
}

func (h *Handler) getEWABalance(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	empID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "invalid employee ID", http.StatusBadRequest)
		return
	}

	balance, err := h.svc.CalculateEWABalance(r.Context(), accountID, empID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]float64{"available_balance": balance})
}

func (h *Handler) requestEWA(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	var req struct {
		EmployeeID uuid.UUID `json:"employee_id"`
		Amount     float64   `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := h.svc.RequestEWA(r.Context(), accountID, req.EmployeeID, req.Amount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(result)
}

func (h *Handler) getEWARequests(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	requests, err := h.svc.GetEWARequests(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, requests)
}

// ============================================
// TREASURY HANDLERS
// ============================================

func (h *Handler) getTreasuryConfigs(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	configs, err := h.svc.GetTreasuryConfig(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(configs)
}

func (h *Handler) updateTreasuryConfig(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var config core.TreasuryConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	updated, err := h.svc.UpdateTreasuryConfig(r.Context(), accountID, config)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(updated)
}

func (h *Handler) runRevenueSweep(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	count, err := h.svc.RunRevenueSweep(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"sweeps_executed": count, "status": "COMPLETED"})
}

func (h *Handler) getLiquidityStats(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	stats, err := h.svc.GetLiquidityStats(r.Context(), accountID)
	if err != nil {
		// Keep dashboard usable even when optional treasury/workflow tables are unavailable.
		api.RespondWithJSON(w, http.StatusOK, map[string]any{
			"total_usdc":       0,
			"total_kes":        0,
			"active_sweeps":    0,
			"active_workflows": 0,
		})
		return
	}
	json.NewEncoder(w).Encode(stats)
}

// ============================================
// SOCIAL GOAL HANDLERS
// ============================================

func (h *Handler) createSocialGoal(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var req struct {
		Title        string  `json:"title"`
		Description  string  `json:"description"`
		TargetAmount float64 `json:"target_amount"`
		Currency     string  `json:"currency"`
		ProductLink  string  `json:"product_link"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	goal, err := h.svc.CreateSocialGoal(r.Context(), accountID, req.Title, req.Description, req.TargetAmount, req.Currency, req.ProductLink, true)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "title is required") || strings.Contains(errMsg, "target amount must be greater than zero") {
			api.RespondWithError(w, http.StatusBadRequest, errMsg)
			return
		}
		api.RespondWithError(w, http.StatusInternalServerError, errMsg)
		return
	}
	api.RespondWithJSON(w, http.StatusOK, goal)
}

func (h *Handler) handleSocialGoalSubroutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/social/goals/")
	path = strings.Trim(path, "/")
	if path == "" {
		api.RespondWithError(w, http.StatusNotFound, "not found")
		return
	}

	parts := strings.Split(path, "/")
	if len(parts) == 1 && r.Method == http.MethodGet {
		h.getSocialGoalByID(w, r, parts[0])
		return
	}

	if len(parts) == 2 && parts[1] == "contributions" && r.Method == http.MethodGet {
		h.getGoalContributionsByGoalID(w, r, parts[0])
		return
	}

	api.RespondWithError(w, http.StatusNotFound, "not found")
}

func (h *Handler) getSocialGoals(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	goals, err := h.svc.GetGoalsByAccount(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(goals)
}

func (h *Handler) getSocialGoalByLink(w http.ResponseWriter, r *http.Request) {
	link := r.URL.Query().Get("link")
	if link == "" {
		http.Error(w, "link is required", http.StatusBadRequest)
		return
	}

	goal, err := h.svc.GetGoalByShareLink(r.Context(), link)
	if err != nil {
		http.Error(w, "goal not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(goal)
}

func (h *Handler) getSocialGoalByID(w http.ResponseWriter, r *http.Request, goalIDStr string) {
	goalID, err := uuid.Parse(goalIDStr)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid goal id")
		return
	}

	goal, err := h.svc.GetGoalByID(r.Context(), goalID)
	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, "goal not found")
		return
	}
	api.RespondWithJSON(w, http.StatusOK, goal)
}

func (h *Handler) getGoalContributions(w http.ResponseWriter, r *http.Request) {
	goalIDStr := r.URL.Query().Get("goal_id")
	if goalIDStr == "" {
		api.RespondWithError(w, http.StatusBadRequest, "goal_id is required")
		return
	}
	h.getGoalContributionsByGoalID(w, r, goalIDStr)
}

func (h *Handler) getGoalContributionsByGoalID(w http.ResponseWriter, r *http.Request, goalIDStr string) {
	goalID, err := uuid.Parse(goalIDStr)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid goal_id")
		return
	}

	contributions, err := h.svc.GetGoalContributions(r.Context(), goalID)
	if err != nil {
		json.NewEncoder(w).Encode([]any{})
		return
	}
	json.NewEncoder(w).Encode(contributions)
}

func (h *Handler) contributeToGoal(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GoalID          uuid.UUID `json:"goal_id"`
		ContributorName string    `json:"contributor_name"`
		Amount          float64   `json:"amount"`
		Currency        string    `json:"currency"`
		AutoConvert     bool      `json:"auto_convert"` // Added AutoConvert field
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Auto-convert currency if needed
	if req.AutoConvert {
		goal, err := h.svc.GetGoalByID(r.Context(), req.GoalID) // Use req.GoalID
		if err != nil {
			http.Error(w, `{"error": "goal not found"}`, http.StatusNotFound)
			return
		}
		req.Amount, err = h.svc.ConvertCurrency(r.Context(), req.Amount, req.Currency, goal.Currency)
		if err != nil {
			http.Error(w, `{"error": "currency conversion failed"}`, http.StatusBadRequest)
			return
		}
		req.Currency = goal.Currency
	}

	contribution, err := h.svc.ContributeToGoal(r.Context(), req.GoalID, req.ContributorName, req.Amount, req.Currency)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(contribution)
}

func (h *Handler) getExchangeRate(w http.ResponseWriter, r *http.Request) {
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	if from == "" || to == "" {
		http.Error(w, "from and to currencies are required", http.StatusBadRequest)
		return
	}

	rate, err := h.svc.GetExchangeRate(r.Context(), from, to)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"from": from,
		"to":   to,
		"rate": rate,
	})
}

func (h *Handler) convertTreasuryAssets(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		FromCurrency string  `json:"from_currency"`
		ToCurrency   string  `json:"to_currency"`
		Amount       float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.svc.ConvertTreasuryAssets(r.Context(), accountID, req.FromCurrency, req.ToCurrency, req.Amount)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, result)
}

func (h *Handler) ejectGoalFunds(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var req struct {
		GoalID uuid.UUID `json:"goal_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := h.svc.EjectGoalFunds(r.Context(), accountID, req.GoalID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": result})
}

// ============================================
// FUNDING SOURCES HANDLERS
// ============================================

func (h *Handler) getFundingSources(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	sources, err := h.svc.GetFundingSources(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(sources)
}

func (h *Handler) addFundingSource(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var fs core.FundingSource
	if err := json.NewDecoder(r.Body).Decode(&fs); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	fs.AccountID = accountID

	if err := h.svc.AddFundingSource(r.Context(), accountID, fs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(fs)
}

func (h *Handler) fundWallet(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusInternalServerError)
		return
	}

	var req struct {
		SourceID uuid.UUID `json:"source_id"`
		Amount   float64   `json:"amount"`
		Currency string    `json:"currency"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	idemKey := r.Header.Get("X-Idempotency-Key")
	if idemKey != "" {
		exists, rec, startErr := h.svc.StartIdempotentRequest(r.Context(), accountID, idemKey, r.URL.Path, body)
		if startErr != nil {
			if handleIdempotencyStartError(w, startErr) {
				return
			}
			http.Error(w, "idempotency error", http.StatusInternalServerError)
			return
		}
		if exists && rec.ResponseCode != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(*rec.ResponseCode)
			w.Write([]byte(*rec.ResponseBody))
			return
		}
		if exists {
			http.Error(w, "request in progress", http.StatusConflict)
			return
		}
	}

	if err := h.svc.FundWallet(r.Context(), accountID, req.SourceID, req.Amount, req.Currency); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		if idemKey != "" {
			_ = h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusInternalServerError, err.Error())
		}
		return
	}

	resp := map[string]string{"message": "Wallet funded successfully"}
	respJSON, _ := json.Marshal(resp)
	if idemKey != "" {
		_ = h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusOK, string(respJSON))
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(respJSON)
}

func (h *Handler) createCirclePayment(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusInternalServerError)
		return
	}

	var req struct {
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	idemKey := r.Header.Get("X-Idempotency-Key")
	if idemKey != "" {
		exists, rec, startErr := h.svc.StartIdempotentRequest(r.Context(), accountID, idemKey, r.URL.Path, body)
		if startErr != nil {
			if handleIdempotencyStartError(w, startErr) {
				return
			}
			http.Error(w, "idempotency error", http.StatusInternalServerError)
			return
		}
		if exists && rec.ResponseCode != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(*rec.ResponseCode)
			w.Write([]byte(*rec.ResponseBody))
			return
		}
		if exists {
			http.Error(w, "request in progress", http.StatusConflict)
			return
		}
	}

	paymentID, err := h.svc.CreateCirclePayment(r.Context(), accountID, req.Amount, req.Currency)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		if idemKey != "" {
			h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusInternalServerError, err.Error())
		}
		return
	}

	resp := map[string]string{"payment_id": paymentID}
	respJson, _ := json.Marshal(resp)
	if idemKey != "" {
		h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusOK, string(respJson))
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(respJson)
}

func (h *Handler) getSolanaDepositInfo(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	address, memo, err := h.svc.GetSolanaDepositInfo(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"address": address,
		"memo":    memo,
	})
}

// ============================================
// ACCOUNT SETTINGS HANDLERS
// ============================================

// ============================================
// ONBOARDING HANDLERS
// ============================================

func (h *Handler) saveOnboardingPreferences(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var data any
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	completed, err := h.svc.SaveOnboardingPreferences(r.Context(), accountID, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":              true,
		"message":              "preferences saved",
		"onboarding_completed": completed,
	})
}

func (h *Handler) getOnboardingStatus(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"onboarding_completed": acc.OnboardingCompleted,
		"onboarding_path":      "guided", // Default or extract from data
	})
}

func (h *Handler) updateWalletAddress(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	var req struct {
		Address string `json:"address"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.UpdateWalletAddress(r.Context(), accountID, req.Address); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func (h *Handler) createManagedWallet(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	wallet, err := h.svc.CreateManagedWallet(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"wallet":  wallet,
	})
}

// ============================================
// HELPER FUNCTIONS
// ============================================

func getAccountIDFromRequest(r *http.Request, svc *core.Service) (uuid.UUID, error) {
	// Try JWT token first
	authHeader := r.Header.Get("Authorization")
	if len(authHeader) >= 7 && authHeader[:7] == "Bearer " {
		token := authHeader[7:]
		user, err := svc.Authenticate(r.Context(), token)
		if err == nil {
			return user.ID, nil
		}
	}

	// Try Cookie next
	if authHeader == "" {
		cookie, err := r.Cookie("corridor_session")
		if err == nil && cookie.Value != "" {
			user, err := svc.Authenticate(r.Context(), cookie.Value)
			if err == nil {
				return user.ID, nil
			}
		}
	}

	// Try API key
	apiKey := r.Header.Get("X-API-Key")
	if apiKey != "" {
		accountID, err := svc.ValidateAPIKey(r.Context(), apiKey)
		if err == nil {
			allowed, _, featureErr := svc.HasFeatureAccess(r.Context(), accountID, "api_access")
			if featureErr != nil || !allowed {
				return uuid.Nil, fmt.Errorf("api access not enabled for this account")
			}
			return accountID, nil
		}
	}

	return uuid.Nil, fmt.Errorf("unauthorized")
}

func handleIdempotencyStartError(w http.ResponseWriter, err error) bool {
	if errors.Is(err, core.ErrIdempotencyKeyMismatch) {
		http.Error(w, core.ErrIdempotencyKeyMismatch.Error(), http.StatusConflict)
		return true
	}
	if errors.Is(err, core.ErrIdempotencyKeyExpired) {
		http.Error(w, core.ErrIdempotencyKeyExpired.Error(), http.StatusConflict)
		return true
	}
	return false
}
