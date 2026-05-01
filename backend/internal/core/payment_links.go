package core

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type PaymentLink struct {
	ID            uuid.UUID `json:"id"`
	AccountID     uuid.UUID `json:"account_id"`
	Title         string    `json:"title"`
	Slug          string    `json:"slug"`
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Views         int       `json:"views"`
	PaymentsCount int       `json:"payments_count"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
}

func (s *Service) CreatePaymentLink(ctx context.Context, accountID uuid.UUID, title string, amount float64, currency string) (*PaymentLink, error) {
	slug := uuid.New().String()[:8] // Simple slug generation

	link := &PaymentLink{
		AccountID: accountID,
		Title:     title,
		Slug:      slug,
		Amount:    amount,
		Currency:  currency,
		IsActive:  true,
	}

	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO payment_links (account_id, title, slug, amount, currency, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, views, payments_count
	`, link.AccountID, link.Title, link.Slug, link.Amount, link.Currency, link.IsActive).Scan(&link.ID, &link.CreatedAt, &link.Views, &link.PaymentsCount)

	if err != nil {
		return nil, err
	}

	return link, nil
}

func (s *Service) GetPaymentLinks(ctx context.Context, accountID uuid.UUID) ([]PaymentLink, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, title, slug, amount, currency, views, payments_count, is_active, created_at
		FROM payment_links
		WHERE account_id = $1
		ORDER BY created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []PaymentLink
	for rows.Next() {
		var l PaymentLink
		if err := rows.Scan(&l.ID, &l.Title, &l.Slug, &l.Amount, &l.Currency, &l.Views, &l.PaymentsCount, &l.IsActive, &l.CreatedAt); err != nil {
			return nil, err
		}
		links = append(links, l)
	}
	return links, nil
}

func (s *Service) GetPaymentLinkBySlug(ctx context.Context, slug string) (*PaymentLink, error) {
	var l PaymentLink
	err := s.db.Pool.QueryRow(ctx, `
		UPDATE payment_links 
		SET views = views + 1 
		WHERE slug = $1 
		RETURNING id, account_id, title, slug, amount, currency, views, payments_count, is_active, created_at
	`, slug).Scan(&l.ID, &l.AccountID, &l.Title, &l.Slug, &l.Amount, &l.Currency, &l.Views, &l.PaymentsCount, &l.IsActive, &l.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &l, nil
}
func (s *Service) UpdatePaymentLink(ctx context.Context, accountID uuid.UUID, id uuid.UUID, isActive bool) error {
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE payment_links 
		SET is_active = $1 
		WHERE id = $2 AND account_id = $3
	`, isActive, id, accountID)
	return err
}

func (s *Service) DeletePaymentLink(ctx context.Context, accountID uuid.UUID, id uuid.UUID) error {
	_, err := s.db.Pool.Exec(ctx, `
		DELETE FROM payment_links 
		WHERE id = $1 AND account_id = $2
	`, id, accountID)
	return err
}

// PaymentLinkTransaction represents a payment made to a payment link
type PaymentLinkTransaction struct {
	ID                uuid.UUID  `json:"id"`
	PaymentLinkID     uuid.UUID  `json:"payment_link_id"`
	PayerEmail        string     `json:"payer_email,omitempty"`
	PayerName         string     `json:"payer_name,omitempty"`
	Amount            float64    `json:"amount"`
	Currency          string     `json:"currency"`
	PaymentMethod     string     `json:"payment_method"`
	Status            string     `json:"status"`
	TransactionID     *uuid.UUID `json:"transaction_id,omitempty"`
	MerchantRequestID string     `json:"merchant_request_id,omitempty"`
	CheckoutRequestID string     `json:"checkout_request_id,omitempty"`
	Metadata          []byte     `json:"metadata,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
}

// InitiatePaymentLinkPayment creates a pending payment transaction
func (s *Service) InitiatePaymentLinkPayment(ctx context.Context, slug string, paymentMethod string, payerEmail string, payerName string, metadata map[string]interface{}) (*PaymentLinkTransaction, error) {
	// Get the payment link
	link, err := s.GetPaymentLinkBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("payment link not found: %w", err)
	}

	if !link.IsActive {
		return nil, errors.New("payment link is inactive")
	}

	// Convert metadata to JSONB
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal metadata: %w", err)
	}

	tx := &PaymentLinkTransaction{
		ID:            uuid.New(),
		PaymentLinkID: link.ID,
		PayerEmail:    payerEmail,
		PayerName:     payerName,
		Amount:        link.Amount,
		Currency:      link.Currency,
		PaymentMethod: paymentMethod,
		Status:        "PENDING",
		Metadata:      metadataJSON,
	}

	err = s.db.Pool.QueryRow(ctx, `
		INSERT INTO payment_link_transactions 
		(payment_link_id, payer_email, payer_name, amount, currency, payment_method, status, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`, tx.PaymentLinkID, tx.PayerEmail, tx.PayerName, tx.Amount, tx.Currency, tx.PaymentMethod, tx.Status, tx.Metadata).Scan(&tx.ID, &tx.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create payment transaction: %w", err)
	}

	return tx, nil
}

// UpdatePaymentLinkTransaction updates the status of a payment transaction
func (s *Service) UpdatePaymentLinkTransaction(ctx context.Context, id uuid.UUID, status string, transactionID *uuid.UUID, merchantRequestID, checkoutRequestID string) error {
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE payment_link_transactions 
		SET status = $1, transaction_id = $2, merchant_request_id = $3, checkout_request_id = $4, completed_at = NOW()
		WHERE id = $5
	`, status, transactionID, merchantRequestID, checkoutRequestID, id)
	return err
}

// CompletePaymentLinkPayment completes a successful payment
func (s *Service) CompletePaymentLinkPayment(ctx context.Context, checkoutRequestID string) error {
	txDB, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start payment settlement: %w", err)
	}
	defer txDB.Rollback(ctx)

	// Get the pending transaction
	var tx PaymentLinkTransaction
	var link PaymentLink
	err = txDB.QueryRow(ctx, `
		SELECT plt.id, plt.payment_link_id, plt.amount, plt.currency, plt.payment_method,
		       pl.account_id, pl.title
		FROM payment_link_transactions plt
		JOIN payment_links pl ON plt.payment_link_id = pl.id
		WHERE plt.checkout_request_id = $1 AND plt.status = 'PENDING'
		FOR UPDATE
	`, checkoutRequestID).Scan(&tx.ID, &tx.PaymentLinkID, &tx.Amount, &tx.Currency, &tx.PaymentMethod, &link.AccountID, &link.Title)

	if err != nil {
		return fmt.Errorf("pending transaction not found: %w", err)
	}

	// Get or create wallet for the account
	var walletID uuid.UUID
	err = txDB.QueryRow(ctx, `
		SELECT id FROM wallets WHERE account_id = $1 LIMIT 1
	`, link.AccountID).Scan(&walletID)

	if err != nil {
		// Create a wallet if not exists
		err = txDB.QueryRow(ctx, `
			INSERT INTO wallets (account_id, balance, currency)
			VALUES ($1, 0, $2)
			RETURNING id
		`, link.AccountID, string(CurrencyUSDC)).Scan(&walletID)
		if err != nil {
			return fmt.Errorf("failed to create wallet: %w", err)
		}
	}

	// Convert currency if needed (e.g., KES to USDC for M-Pesa)
	amount := roundMoney(tx.Amount)
	settlementCurrency := string(CurrencyUSDC)
	if NormalizeCurrencyCode(tx.Currency) == CurrencyKES {
		converted, err := s.ConvertCurrency(ctx, tx.Amount, string(CurrencyKES), string(CurrencyUSDC))
		if err != nil {
			return fmt.Errorf("currency conversion failed: %w", err)
		}
		amount = roundMoney(converted)
	}
	feeAmount := roundMoney(amount * 0.015)
	netAmount := roundMoney(amount - feeAmount)

	// Create internal transaction record
	var transactionID uuid.UUID
	err = txDB.QueryRow(ctx, `
		INSERT INTO transactions (recipient_wallet_id, amount, currency, status, message)
		VALUES ($1, $2, $3, 'COMPLETED', $4)
		RETURNING id
	`, walletID, netAmount, settlementCurrency, s.BrandedMessage(ctx, fmt.Sprintf("Payment link: %s", link.Title))).Scan(&transactionID)

	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}

	// Update wallet balance
	_, err = txDB.Exec(ctx,
		"UPDATE wallets SET balance = balance + $1 WHERE id = $2",
		netAmount, walletID)
	if err != nil {
		return fmt.Errorf("failed to update wallet: %w", err)
	}

	// Update payment link transaction status
	_, err = txDB.Exec(ctx, `
		UPDATE payment_link_transactions
		SET status = 'COMPLETED', transaction_id = $1, merchant_request_id = '', checkout_request_id = $2, completed_at = NOW()
		WHERE id = $3
	`, transactionID, checkoutRequestID, tx.ID)
	if err != nil {
		return fmt.Errorf("failed to update payment transaction: %w", err)
	}

	// Update payment link stats
	_, err = txDB.Exec(ctx, `
		UPDATE payment_links 
		SET payments_count = payments_count + 1,
		    total_revenue = total_revenue + $1,
		    platform_fee = COALESCE(platform_fee, 0) + $1,
		    net_amount = COALESCE(net_amount, 0) + $2,
		    platform_fee_rate = 0.015
		WHERE id = $3
	`, feeAmount, netAmount, tx.PaymentLinkID)
	if err != nil {
		return fmt.Errorf("failed to update payment link stats: %w", err)
	}

	if err := s.DistributeRevenueTx(ctx, txDB, &link.AccountID, feeAmount, settlementCurrency, "payment_link", tx.ID.String(), map[string]any{
		"payment_link_id": tx.PaymentLinkID.String(),
		"checkout_request_id": checkoutRequestID,
		"original_amount": tx.Amount,
		"original_currency": tx.Currency,
		"net_amount": netAmount,
		"fee_rate": 0.015,
	}); err != nil {
		return err
	}

	return txDB.Commit(ctx)
}

// GetPaymentLinkTransactions retrieves all transactions for a payment link
func (s *Service) GetPaymentLinkTransactions(ctx context.Context, paymentLinkID uuid.UUID) ([]PaymentLinkTransaction, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, payment_link_id, payer_email, payer_name, amount, currency, 
		       payment_method, status, transaction_id, merchant_request_id, 
		       checkout_request_id, created_at, completed_at
		FROM payment_link_transactions
		WHERE payment_link_id = $1
		ORDER BY created_at DESC
	`, paymentLinkID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []PaymentLinkTransaction
	for rows.Next() {
		var tx PaymentLinkTransaction
		var metadata []byte
		err := rows.Scan(&tx.ID, &tx.PaymentLinkID, &tx.PayerEmail, &tx.PayerName, 
			&tx.Amount, &tx.Currency, &tx.PaymentMethod, &tx.Status, 
			&tx.TransactionID, &tx.MerchantRequestID, &tx.CheckoutRequestID, 
			&tx.CreatedAt, &tx.CompletedAt)
		if err != nil {
			return nil, err
		}
		tx.Metadata = metadata
		transactions = append(transactions, tx)
	}
	return transactions, nil
}
