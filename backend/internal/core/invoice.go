package core

import (
	"context"
	"fmt"
	"os"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Invoice struct {
	ID               uuid.UUID     `json:"id"`
	AccountID        uuid.UUID     `json:"account_id"`
	CustomerID       uuid.UUID     `json:"customer_id"`
	CustomerName     string        `json:"customer_name,omitempty"`
	CustomerEmail    string        `json:"customer_email,omitempty"`
	CustomerPhone    string        `json:"customer_phone,omitempty"`
	Number           string        `json:"number"`
	Currency         string        `json:"currency"`
	Subtotal         float64       `json:"subtotal"`
	Tax              float64       `json:"tax"`
	Total            float64       `json:"total"`
	Status           string        `json:"status"`
	DueDate          *time.Time    `json:"due_date,omitempty"`
	Reference        string        `json:"reference,omitempty"`
	Notes            string        `json:"notes,omitempty"`
	PayLink          string        `json:"pay_link,omitempty"`
	PaymentSessionID string        `json:"payment_session_id,omitempty"`
	CreatedAt        time.Time     `json:"created_at"`
	PaidAt           *time.Time    `json:"paid_at,omitempty"`
	Items            []InvoiceItem `json:"items"`
}

type InvoiceItem struct {
	ID          uuid.UUID `json:"id"`
	InvoiceID   uuid.UUID `json:"invoice_id"`
	Description string    `json:"description"`
	Qty         int       `json:"qty"`
	UnitPrice   float64   `json:"unit_price"`
	LineTotal   float64   `json:"line_total"`
}

type CreateInvoiceInput struct {
	CustomerID uuid.UUID
	Currency   string
	Reference  string
	Notes      string
	Items      []struct {
		Description string
		Qty         int
		UnitPrice   float64
	}
	DueDate *time.Time
}

type UpdateInvoiceInput struct {
	CustomerID uuid.UUID
	Currency   string
	Reference  string
	Notes      string
	Items      []struct {
		Description string
		Qty         int
		UnitPrice   float64
	}
	DueDate *time.Time
}

type InvoiceDeliveryResult struct {
	InvoiceID      uuid.UUID `json:"invoice_id"`
	Channel        string    `json:"channel"`
	Message        string    `json:"message"`
	WhatsAppURL    string    `json:"whatsapp_url,omitempty"`
	EmailSent      bool      `json:"email_sent"`
	EmailRecipient string    `json:"email_recipient,omitempty"`
}

// CreateInvoice creates a new invoice
func (s *Service) CreateInvoice(ctx context.Context, accountID uuid.UUID, input CreateInvoiceInput) (*Invoice, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start invoice transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// Calculate totals
	var subtotal float64
	for _, item := range input.Items {
		subtotal += float64(item.Qty) * item.UnitPrice
	}
	tax := subtotal * 0.0 // TODO: Implement tax calculation
	total := subtotal + tax

	// Generate invoice number
	var invoiceNum string
	err = s.db.Pool.QueryRow(ctx, `SELECT generate_invoice_number()`).Scan(&invoiceNum)
	if err != nil {
		return nil, fmt.Errorf("failed to generate invoice number: %w", err)
	}

	id := uuid.New()
	sessionID := uuid.New().String()
	payBaseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("PAY_BASE_URL")), "/")
	paymentURL := fmt.Sprintf("/invoice/%s?session=%s", id.String(), sessionID)
	if payBaseURL != "" {
		paymentURL = fmt.Sprintf("%s/invoice/%s?session=%s", payBaseURL, id.String(), sessionID)
	}

	// Create invoice
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO invoices (id, account_id, customer_id, number, currency, subtotal, tax, total, due_date, reference, notes, pay_link, payment_session_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at
	`, id, accountID, input.CustomerID, invoiceNum, input.Currency, subtotal, tax, total, input.DueDate, strings.TrimSpace(input.Reference), strings.TrimSpace(input.Notes), paymentURL, sessionID).Scan(&id, &createdAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	// Create invoice items
	var items []InvoiceItem
	for _, itemInput := range input.Items {
		lineTotal := float64(itemInput.Qty) * itemInput.UnitPrice
		var itemID uuid.UUID
		err := tx.QueryRow(ctx, `
			INSERT INTO invoice_items (invoice_id, description, qty, unit_price, line_total)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, id, itemInput.Description, itemInput.Qty, itemInput.UnitPrice, lineTotal).Scan(&itemID)

		if err != nil {
			return nil, fmt.Errorf("failed to create invoice item: %w", err)
		}

		items = append(items, InvoiceItem{
			ID:          itemID,
			InvoiceID:   id,
			Description: itemInput.Description,
			Qty:         itemInput.Qty,
			UnitPrice:   itemInput.UnitPrice,
			LineTotal:   lineTotal,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit invoice: %w", err)
	}

	return &Invoice{
		ID:               id,
		AccountID:        accountID,
		CustomerID:       input.CustomerID,
		Number:           invoiceNum,
		Currency:         input.Currency,
		Subtotal:         subtotal,
		Tax:              tax,
		Total:            total,
		Status:           "pending",
		DueDate:          input.DueDate,
		Reference:        strings.TrimSpace(input.Reference),
		Notes:            strings.TrimSpace(input.Notes),
		PayLink:          paymentURL,
		PaymentSessionID: sessionID,
		CreatedAt:        createdAt,
		Items:            items,
	}, nil
}

// UpdateInvoice updates an existing invoice and replaces its items.
func (s *Service) UpdateInvoice(ctx context.Context, accountID, invoiceID uuid.UUID, input UpdateInvoiceInput) (*Invoice, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start invoice update: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var currentStatus string
	if err := tx.QueryRow(ctx, `
		SELECT status
		FROM invoices
		WHERE id = $1 AND account_id = $2
		FOR UPDATE
	`, invoiceID, accountID).Scan(&currentStatus); err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if strings.EqualFold(currentStatus, "paid") {
		return nil, fmt.Errorf("paid invoices cannot be edited")
	}

	var subtotal float64
	for _, item := range input.Items {
		subtotal += float64(item.Qty) * item.UnitPrice
	}
	tax := subtotal * 0.0
	total := subtotal + tax

	if _, err := tx.Exec(ctx, `
		UPDATE invoices
		SET customer_id = $1,
		    currency = $2,
		    subtotal = $3,
		    tax = $4,
		    total = $5,
		    due_date = $6,
		    reference = $7,
		    notes = $8
		WHERE id = $9 AND account_id = $10
	`, input.CustomerID, strings.ToUpper(strings.TrimSpace(input.Currency)), subtotal, tax, total, input.DueDate, strings.TrimSpace(input.Reference), strings.TrimSpace(input.Notes), invoiceID, accountID); err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	if _, err := tx.Exec(ctx, `DELETE FROM invoice_items WHERE invoice_id = $1`, invoiceID); err != nil {
		return nil, fmt.Errorf("failed to replace invoice items: %w", err)
	}

	for _, itemInput := range input.Items {
		lineTotal := float64(itemInput.Qty) * itemInput.UnitPrice
		if _, err := tx.Exec(ctx, `
			INSERT INTO invoice_items (invoice_id, description, qty, unit_price, line_total)
			VALUES ($1, $2, $3, $4, $5)
		`, invoiceID, itemInput.Description, itemInput.Qty, itemInput.UnitPrice, lineTotal); err != nil {
			return nil, fmt.Errorf("failed to update invoice items: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit invoice update: %w", err)
	}

	return s.GetInvoice(ctx, accountID, invoiceID)
}

// GetInvoices retrieves invoices for an account
func (s *Service) GetInvoices(ctx context.Context, accountID uuid.UUID, status string) ([]Invoice, error) {
	query := `
		SELECT i.id, i.account_id, i.customer_id, c.name, COALESCE(c.email, ''), COALESCE(c.phone, ''), i.number, i.currency, i.subtotal, i.tax, i.total, i.status, i.due_date,
		       COALESCE(i.reference, ''), COALESCE(i.notes, ''), COALESCE(i.pay_link, ''), i.created_at, i.paid_at
		FROM invoices i
		LEFT JOIN customers c ON c.id = i.customer_id
		WHERE i.account_id = $1
	`
	args := []interface{}{accountID}

	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := s.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		var inv Invoice
		err := rows.Scan(&inv.ID, &inv.AccountID, &inv.CustomerID, &inv.CustomerName, &inv.CustomerEmail, &inv.CustomerPhone, &inv.Number, &inv.Currency,
			&inv.Subtotal, &inv.Tax, &inv.Total, &inv.Status, &inv.DueDate, &inv.Reference, &inv.Notes, &inv.PayLink,
			&inv.CreatedAt, &inv.PaidAt)
		if err != nil {
			return nil, err
		}
		invoices = append(invoices, inv)
	}
	return invoices, nil
}

// GetInvoice retrieves a single invoice with items (with ownership check)
func (s *Service) GetInvoice(ctx context.Context, accountID, invoiceID uuid.UUID) (*Invoice, error) {
	var inv Invoice
	err := s.db.Pool.QueryRow(ctx, `
		SELECT i.id, i.account_id, i.customer_id, c.name, COALESCE(c.email, ''), COALESCE(c.phone, ''), i.number, i.currency, i.subtotal, i.tax, i.total, i.status, i.due_date,
		       COALESCE(i.reference, ''), COALESCE(i.notes, ''), COALESCE(i.pay_link, ''), i.payment_session_id, i.created_at, i.paid_at
		FROM invoices i
		LEFT JOIN customers c ON c.id = i.customer_id
		WHERE i.id = $2 AND i.account_id = $1
	`, accountID, invoiceID).Scan(&inv.ID, &inv.AccountID, &inv.CustomerID, &inv.CustomerName, &inv.CustomerEmail, &inv.CustomerPhone, &inv.Number, &inv.Currency,
		&inv.Subtotal, &inv.Tax, &inv.Total, &inv.Status, &inv.DueDate, &inv.Reference, &inv.Notes, &inv.PayLink, &inv.PaymentSessionID,
		&inv.CreatedAt, &inv.PaidAt)

	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	// Get items
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, invoice_id, description, qty, unit_price, line_total
		FROM invoice_items
		WHERE invoice_id = $1
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InvoiceItem
	for rows.Next() {
		var item InvoiceItem
		if err := rows.Scan(&item.ID, &item.InvoiceID, &item.Description, &item.Qty, &item.UnitPrice, &item.LineTotal); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	inv.Items = items

	return &inv, nil
}

// GetPublicInvoice retrieves an invoice for the signed public payment link or recipient contact.
func (s *Service) GetPublicInvoice(ctx context.Context, invoiceID uuid.UUID, session, email, phone string) (*Invoice, error) {
	var inv Invoice
	var storedSession string
	err := s.db.Pool.QueryRow(ctx, `
		SELECT i.id, i.account_id, i.customer_id, c.name, COALESCE(c.email, ''), COALESCE(c.phone, ''), i.number, i.currency, i.subtotal, i.tax, i.total, i.status, i.due_date,
		       COALESCE(i.reference, ''), COALESCE(i.notes, ''), COALESCE(i.pay_link, ''), COALESCE(i.payment_session_id, ''), i.created_at, i.paid_at
		FROM invoices i
		LEFT JOIN customers c ON c.id = i.customer_id
		WHERE i.id = $1
	`, invoiceID).Scan(&inv.ID, &inv.AccountID, &inv.CustomerID, &inv.CustomerName, &inv.CustomerEmail, &inv.CustomerPhone, &inv.Number, &inv.Currency,
		&inv.Subtotal, &inv.Tax, &inv.Total, &inv.Status, &inv.DueDate, &inv.Reference, &inv.Notes, &inv.PayLink, &storedSession, &inv.CreatedAt, &inv.PaidAt)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if !publicInvoiceAccessGranted(storedSession, session, inv.CustomerEmail, email, inv.CustomerPhone, phone) {
		return nil, fmt.Errorf("invoice access denied")
	}

	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, invoice_id, description, qty, unit_price, line_total
		FROM invoice_items
		WHERE invoice_id = $1
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InvoiceItem
	for rows.Next() {
		var item InvoiceItem
		if err := rows.Scan(&item.ID, &item.InvoiceID, &item.Description, &item.Qty, &item.UnitPrice, &item.LineTotal); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	inv.Items = items

	return &inv, nil
}

func publicInvoiceAccessGranted(storedSession, session, customerEmail, email, customerPhone, phone string) bool {
	storedSession = strings.TrimSpace(storedSession)
	session = strings.TrimSpace(session)
	if storedSession != "" && session != "" && storedSession == session {
		return true
	}

	if strings.TrimSpace(customerEmail) != "" && strings.EqualFold(strings.TrimSpace(customerEmail), strings.TrimSpace(email)) {
		return true
	}

	if strings.TrimSpace(customerPhone) != "" && strings.TrimSpace(customerPhone) == strings.TrimSpace(phone) {
		return true
	}

	return false
}

// GeneratePaymentLink generates a payment link for an invoice
func (s *Service) GeneratePaymentLink(ctx context.Context, accountID, invoiceID uuid.UUID) (string, string, error) {
	// Generate a unique session ID
	sessionID := uuid.New().String()
	payBaseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("PAY_BASE_URL")), "/")
	paymentURL := fmt.Sprintf("/invoice/%s?session=%s", invoiceID, sessionID)
	if payBaseURL != "" {
		paymentURL = fmt.Sprintf("%s/invoice/%s?session=%s", payBaseURL, invoiceID, sessionID)
	}

	// Update invoice (with ownership check)
	res, err := s.db.Pool.Exec(ctx, `
		UPDATE invoices
		SET pay_link = $1, payment_session_id = $2
		WHERE id = $3 AND account_id = $4
	`, paymentURL, sessionID, invoiceID, accountID)

	if err != nil {
		return "", "", fmt.Errorf("failed to generate payment link: %w", err)
	}

	if res.RowsAffected() == 0 {
		return "", "", fmt.Errorf("invoice not found or unauthorized")
	}

	return paymentURL, sessionID, nil
}

// SendInvoice sends the invoice through email and prepares a WhatsApp deep link.
func (s *Service) SendInvoice(ctx context.Context, accountID, invoiceID uuid.UUID) (*InvoiceDeliveryResult, error) {
	return s.sendInvoiceDelivery(ctx, accountID, invoiceID, false)
}

// SendReminder sends a payment reminder through email and prepares a WhatsApp deep link.
func (s *Service) SendReminder(ctx context.Context, accountID, invoiceID uuid.UUID) (*InvoiceDeliveryResult, error) {
	return s.sendInvoiceDelivery(ctx, accountID, invoiceID, true)
}

func (s *Service) sendInvoiceDelivery(ctx context.Context, accountID, invoiceID uuid.UUID, reminder bool) (*InvoiceDeliveryResult, error) {
	invoice, err := s.GetInvoice(ctx, accountID, invoiceID)
	if err != nil {
		return nil, err
	}

	link := strings.TrimSpace(invoice.PayLink)
	if link == "" && strings.TrimSpace(invoice.PaymentSessionID) != "" {
		base := strings.TrimRight(strings.TrimSpace(os.Getenv("PAY_BASE_URL")), "/")
		link = fmt.Sprintf("/invoice/%s?session=%s", invoice.ID.String(), invoice.PaymentSessionID)
		if base != "" {
			link = fmt.Sprintf("%s/invoice/%s?session=%s", base, invoice.ID.String(), invoice.PaymentSessionID)
		}
	}

	message := buildInvoiceMessage(invoice, link, reminder)

	emailSent := false
	emailRecipient := ""
	subject := fmt.Sprintf("Corridor invoice %s", invoice.Number)
	if reminder {
		subject = fmt.Sprintf("Reminder: Corridor invoice %s", invoice.Number)
	}

	if s.email != nil && strings.TrimSpace(invoice.CustomerEmail) != "" {
		html := buildInvoiceEmailHTML(invoice, link, message, reminder)
		if err := s.email.Send(invoice.CustomerEmail, subject, html); err == nil {
			emailSent = true
			emailRecipient = invoice.CustomerEmail
		}
	}

	whatsappURL := ""
	if phone := normalizeWhatsAppNumber(invoice.CustomerPhone); phone != "" {
		whatsappURL = fmt.Sprintf("https://wa.me/%s?text=%s", phone, url.QueryEscape(message))
	}

	channel := "email"
	if reminder {
		channel = "reminder"
	}
	if whatsappURL != "" {
		channel = "whatsapp"
	}
	if emailSent && whatsappURL != "" {
		channel = "email+whatsapp"
	}

	return &InvoiceDeliveryResult{
		InvoiceID:      invoice.ID,
		Channel:        channel,
		Message:        message,
		WhatsAppURL:    whatsappURL,
		EmailSent:      emailSent,
		EmailRecipient: emailRecipient,
	}, nil
}

func buildInvoiceMessage(invoice *Invoice, link string, reminder bool) string {
	recipient := invoice.CustomerName
	if strings.TrimSpace(recipient) == "" {
		recipient = "there"
	}

	total := fmt.Sprintf("%s %.2f", strings.ToUpper(strings.TrimSpace(invoice.Currency)), invoice.Total)
	dueText := "due on receipt"
	if invoice.DueDate != nil {
		dueText = fmt.Sprintf("due %s", invoice.DueDate.Format("2 Jan 2006"))
	}

	verb := "Invoice"
	if reminder {
		verb = "Reminder"
	}

	message := fmt.Sprintf("Hi %s, Corridor %s %s for %s is %s. Open the invoice here: %s", recipient, verb, invoice.Number, total, dueText, link)
	if strings.TrimSpace(invoice.Reference) != "" {
		message = fmt.Sprintf("%s Reference: %s.", message, invoice.Reference)
	}
	return message
}

func buildInvoiceEmailHTML(invoice *Invoice, link, message string, reminder bool) string {
	title := "Your invoice is ready"
	if reminder {
		title = "Payment reminder for your invoice"
	}

	dueText := "Due on receipt"
	if invoice.DueDate != nil {
		dueText = fmt.Sprintf("Due %s", invoice.DueDate.Format("2 Jan 2006"))
	}

	return fmt.Sprintf(`
		<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
			<h2 style="margin:0 0 12px">%s</h2>
			<p>Hello %s,</p>
			<p>%s</p>
			<p><strong>Invoice:</strong> %s<br/>
			<strong>Amount:</strong> %s %.2f<br/>
			<strong>%s</strong></p>
			<p><a href="%s" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px">View invoice</a></p>
			<p style="color:#6b7280;font-size:12px">If the button does not work, copy this link: %s</p>
		</div>`,
		title,
		invoice.CustomerName,
		message,
		invoice.Number,
		strings.ToUpper(strings.TrimSpace(invoice.Currency)),
		invoice.Total,
		dueText,
		link,
		link,
	)
}

func normalizeWhatsAppNumber(raw string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(raw) {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// ProcessPublicPayment simulates processing an invoice payment
func (s *Service) ProcessPublicPayment(ctx context.Context, invoiceID uuid.UUID) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start invoice settlement: %w", err)
	}
	defer tx.Rollback(ctx)

	var accountID uuid.UUID
	var total float64
	var currency string
	var status string
	var invoiceNumber string
	err = tx.QueryRow(ctx, `
		SELECT account_id, total, currency, status, number
		FROM invoices
		WHERE id = $1
		FOR UPDATE
	`, invoiceID).Scan(&accountID, &total, &currency, &status, &invoiceNumber)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}
	if strings.EqualFold(status, "paid") {
		return fmt.Errorf("invoice already paid")
	}

	currency = strings.ToUpper(strings.TrimSpace(currency))
	if currency == "" {
		currency = string(CurrencyUSDC)
	}
	total = roundMoney(total)
	feeAmount := roundMoney(total * 0.015)
	netAmount := roundMoney(total - feeAmount)

	var walletID uuid.UUID
	err = tx.QueryRow(ctx, `
		SELECT id
		FROM wallets
		WHERE account_id = $1 AND currency = $2
		LIMIT 1
	`, accountID, currency).Scan(&walletID)
	if err != nil {
		err = tx.QueryRow(ctx, `
			INSERT INTO wallets (account_id, balance, currency)
			VALUES ($1, 0, $2)
			RETURNING id
		`, accountID, currency).Scan(&walletID)
		if err != nil {
			return fmt.Errorf("failed to create settlement wallet: %w", err)
		}
	}

	var transactionID uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO transactions (recipient_wallet_id, amount, total_amount, currency, status, message)
		VALUES ($1, $2, $3, $4, 'COMPLETED', $5)
		RETURNING id
	`, walletID, netAmount, total, currency, s.BrandedMessage(ctx, fmt.Sprintf("Invoice payment: %s", invoiceNumber))).Scan(&transactionID); err != nil {
		return fmt.Errorf("failed to create invoice transaction: %w", err)
	}

	if _, err := tx.Exec(ctx, `UPDATE wallets SET balance = balance + $1 WHERE id = $2`, netAmount, walletID); err != nil {
		return fmt.Errorf("failed to update settlement wallet: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE invoices
		SET status = 'paid',
		    paid_at = NOW(),
		    paid_amount = $1,
		    platform_fee_rate = 0.015,
		    platform_fee = $2,
		    net_amount = $3
		WHERE id = $4
	`, total, feeAmount, netAmount, invoiceID); err != nil {
		return fmt.Errorf("failed to update invoice status: %w", err)
	}

	if err := s.DistributeRevenueTx(ctx, tx, &accountID, feeAmount, currency, "invoice_payment", invoiceID.String(), map[string]any{
		"invoice_number": invoiceNumber,
		"total_amount": total,
		"net_amount": netAmount,
		"fee_rate": 0.015,
	}); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit invoice payment: %w", err)
	}

	return nil
}

func (s *Service) DeleteInvoice(ctx context.Context, accountID, invoiceID uuid.UUID) error {
	var status string
	err := s.db.Pool.QueryRow(ctx, "SELECT status FROM invoices WHERE id = $1 AND account_id = $2", invoiceID, accountID).Scan(&status)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}

	if strings.EqualFold(status, "paid") {
		return fmt.Errorf("cannot delete a paid invoice")
	}

	_, err = s.db.Pool.Exec(ctx, "DELETE FROM invoices WHERE id = $1 AND account_id = $2", invoiceID, accountID)
	return err
}
