package core

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
)

type PaymentRail string

const (
	RailPaystackCard PaymentRail = "paystack_card"
	RailMPesa        PaymentRail = "mpesa"
	RailCircleUSDC   PaymentRail = "circle_usdc"
	RailSolanaNative PaymentRail = "solana_native"
	RailInternal     PaymentRail = "internal_ledger"
)

type DepositRequest struct {
	AccountID uuid.UUID   `json:"account_id"`
	Amount    float64     `json:"amount"`
	Currency  string      `json:"currency"`
	Rail      PaymentRail `json:"rail"`
	Metadata  map[string]interface{} `json:"metadata"`
}

type WithdrawRequest struct {
	AccountID   uuid.UUID   `json:"account_id"`
	Amount      float64     `json:"amount"`
	Currency    string      `json:"currency"`
	Rail        PaymentRail `json:"rail"`
	Destination string      `json:"destination"` // bank account, wallet address, etc.
}

type PaymentRailsService struct {
	svc *Service
}

func NewPaymentRailsService(svc *Service) *PaymentRailsService {
	return &PaymentRailsService{svc: svc}
}

// ProcessDeposit routes deposits through appropriate external rails
func (p *PaymentRailsService) ProcessDeposit(ctx context.Context, req DepositRequest) (string, error) {
	switch req.Rail {
	case RailPaystackCard:
		return p.processPaystackDeposit(ctx, req)
	case RailMPesa:
		return p.processMPesaDeposit(ctx, req)
	case RailCircleUSDC:
		return p.processCircleDeposit(ctx, req)
	case RailSolanaNative:
		return p.processSolanaDeposit(ctx, req)
	default:
		return "", fmt.Errorf("unsupported deposit rail: %s", req.Rail)
	}
}

// ProcessWithdraw routes withdrawals through appropriate external rails
func (p *PaymentRailsService) ProcessWithdraw(ctx context.Context, req WithdrawRequest) error {
	switch req.Rail {
	case RailPaystackCard:
		return p.processPaystackWithdraw(ctx, req)
	case RailCircleUSDC:
		return p.processCircleWithdraw(ctx, req)
	case RailSolanaNative:
		return p.processSolanaWithdraw(ctx, req)
	default:
		return fmt.Errorf("unsupported withdrawal rail: %s", req.Rail)
	}
}

// InternalTransfer processes ledger-based transfers without external fees
func (p *PaymentRailsService) InternalTransfer(ctx context.Context, fromWallet, toWallet uuid.UUID, amount float64, description string) (*Transaction, error) {
	return p.svc.InternalTransfer(ctx, fromWallet, toWallet, amount, description)
}

func (p *PaymentRailsService) processPaystackDeposit(ctx context.Context, req DepositRequest) (string, error) {
	// Get user email for Paystack
	var email string
	if err := p.svc.GetAccountInfo(ctx, req.AccountID, &email, nil); err != nil {
		return "", err
	}

	// Initialize Paystack payment
	_ = map[string]interface{}{
		"email":    email,
		"amount":   int64(req.Amount * 100), // Convert to kobo
		"currency": req.Currency,
		"metadata": req.Metadata,
	}

	// Return authorization URL for frontend redirect
	return "paystack_auth_url", nil
}

func (p *PaymentRailsService) processMPesaDeposit(ctx context.Context, req DepositRequest) (string, error) {
	phone, ok := req.Metadata["phone"].(string)
	if !ok {
		return "", fmt.Errorf("phone number required for M-Pesa")
	}

	if _, err := p.svc.TriggerMpesaSTKPush(ctx, phone, req.Amount); err != nil {
		return "", err
	}

	return "mpesa_stk_initiated", nil
}

func (p *PaymentRailsService) processCircleDeposit(ctx context.Context, req DepositRequest) (string, error) {
	// Return a deposit address for the user (mapped from master wallet or unique derivation)
	addr, _, err := p.svc.GetSolanaDepositInfo(ctx, req.AccountID)
	return addr, err
}

func (p *PaymentRailsService) processSolanaDeposit(ctx context.Context, req DepositRequest) (string, error) {
	addr, _, err := p.svc.GetSolanaDepositInfo(ctx, req.AccountID)
	return addr, err
}

func (p *PaymentRailsService) processPaystackWithdraw(ctx context.Context, req WithdrawRequest) error {
	return fmt.Errorf("paystack withdrawal not implemented in this demo")
}

func (p *PaymentRailsService) processMPesaWithdraw(ctx context.Context, req WithdrawRequest) error {
	_, err := p.svc.WithdrawToMpesa(ctx, req.AccountID, req.Amount, req.Destination)
	return err
}

// WithdrawToMpesa performs a stablecoin -> KES conversion and triggers a B2C payout.
func (s *Service) WithdrawToMpesa(ctx context.Context, accountID uuid.UUID, amountUSD float64, phone string) (string, error) {
	// 1. Calculate Fee (1%)
	feeUSD := amountUSD * 0.01
	netUSD := amountUSD - feeUSD

	// 2. Convert net USDC to KES
	amountKES, err := s.ConvertCurrency(ctx, netUSD, string(CurrencyUSDC), string(CurrencyKES))
	if err != nil {
		return "", fmt.Errorf("conversion failed: %w", err)
	}

	// 3. Find Primary Wallet to debit
	var walletID uuid.UUID
	err = s.db.Pool.QueryRow(ctx, "SELECT id FROM wallets WHERE account_id = $1 AND currency = $2 AND is_primary = true", accountID, string(CurrencyUSDC)).Scan(&walletID)
	if err != nil {
		return "", fmt.Errorf("USDC wallet not found")
	}

	// 4. Debit Wallet (Total Amount)
	_, err = s.db.Pool.Exec(ctx, "UPDATE wallets SET balance = balance - $1 WHERE id = $2", amountUSD, walletID)
	if err != nil {
		return "", fmt.Errorf("insufficient funds")
	}

	// 5. Record Transaction
	_, err = s.db.Pool.Exec(ctx, `
		INSERT INTO transactions (sender_wallet_id, amount, fee, currency, status, message)
		VALUES ($1, $2, $3, $4, 'COMPLETED', $5)
	`, walletID, amountUSD, feeUSD, string(CurrencyUSDC), fmt.Sprintf("M-Pesa Withdrawal to %s (KES %.2f)", phone, amountKES))
	
	// 6. Distribution
	if feeUSD > 0 {
		_ = s.DistributeRevenue(ctx, feeUSD, string(CurrencyUSDC))
	}
	
	// 7. Trigger M-Pesa B2C
	err = s.TriggerMpesaB2C(ctx, phone, amountKES, "Corridor Withdrawal")
	if err != nil {
		return "", err
	}

	return "mpesa_withdrawal_initiated", nil
}

func (p *PaymentRailsService) processCircleWithdraw(ctx context.Context, req WithdrawRequest) error {
	// In a real app, you would call Circle's Payouts API
	log.Printf("CIRCLE_PAYOUT: Withdrawing %.2f %s to %s", req.Amount, req.Currency, req.Destination)
	return nil // Simulated success
}

func (p *PaymentRailsService) processSolanaWithdraw(ctx context.Context, req WithdrawRequest) error {
	if p.svc.solanaClient == nil {
		return fmt.Errorf("solana client not initialized")
	}
	// Amount in SOL lamports or USDC base units
	amountUnits := uint64(req.Amount * 1_000_000) // 6 decimals for USDC
	sig, err := p.svc.solanaClient.SendSPLTransfer(ctx, req.Destination, amountUnits, "Withdrawal: "+req.AccountID.String()[:8])
	if err != nil {
		return err
	}
	log.Printf("SOLANA_WITHDRAW: Transaction sent: %s", sig)
	return nil
}

func (s *Service) GetSolanaDepositInfo(ctx context.Context, accountID uuid.UUID) (string, string, error) {
	addr := s.solanaConfig.MasterWallet
	if addr == "" {
		// Fallback to a Demo Treasury address if not configured, to avoid 500 errors in dev/preview
		addr = "9WzDX9GvG9BuvvM1xK3rS8N9E4B2j31F3bDE6bKk8xK5" // Demo Address
	}
	memo := accountID.String()[:8]
	return addr, memo, nil
}

func (s *Service) UpdateAccountBillingMetadata(ctx context.Context, accountID uuid.UUID, metadata map[string]any) error {
	b, _ := json.Marshal(metadata)
	_, err := s.db.Pool.Exec(ctx, "UPDATE accounts SET settings = settings || $1 WHERE id = $2", b, accountID)
	return err
}

func (s *Service) FundWallet(ctx context.Context, accountID uuid.UUID, sourceID uuid.UUID, amount float64, currency string) error {
	var fsType string
	var externalID string
	err := s.db.Pool.QueryRow(ctx, "SELECT type, external_id FROM funding_sources WHERE id = $1 AND account_id = $2", sourceID, accountID).Scan(&fsType, &externalID)
	if err != nil {
		return fmt.Errorf("funding source not found or unauthorized")
	}

	switch fsType {
	case "MPESA":
		// Trigger STK Push
		if _, err := s.TriggerMpesaSTKPush(ctx, externalID, amount); err != nil {
			return fmt.Errorf("mpesa stk push failed: %w", err)
		}
		return s.CreditWallet(ctx, accountID, amount, currency, "Top-up via M-Pesa (STK Push Initialized)")

	case "CARD":
		// Create Circle Payment
		paymentID, err := s.CreateCirclePayment(ctx, accountID, amount, currency)
		if err != nil {
			return fmt.Errorf("circle card payment failed: %w", err)
		}
		return s.CreditWallet(ctx, accountID, amount, currency, fmt.Sprintf("Top-up via Card (Circle: %s)", paymentID))

	default:
		return s.CreditWallet(ctx, accountID, amount, currency, fmt.Sprintf("Top-up via %s", fsType))
	}
}

func (s *Service) AddFundingSource(ctx context.Context, accountID uuid.UUID, fs FundingSource) error {
	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO funding_sources (account_id, type, last4, expiry, brand, external_id, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
	`, accountID, fs.Type, fs.Last4, fs.Expiry, fs.Brand, fs.ExternalID)
	return err
}

func (s *Service) TopUpWalletWithFundingSource(ctx context.Context, accountID uuid.UUID, sourceID uuid.UUID, amount float64, currency string) (string, error) {
	err := s.FundWallet(ctx, accountID, sourceID, amount, currency)
	if err != nil {
		return "", err
	}
	return "tx_" + uuid.New().String()[:8], nil
}
