package core

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

func jsonbString(m map[string]any) string {
	if m == nil {
		m = map[string]any{}
	}
	b, err := json.Marshal(m)
	if err != nil {
		return `{}`
	}
	return string(b)
}

// GetAccountByID fetches an account by ID
func (s *Service) GetAccountByID(ctx context.Context, accountID uuid.UUID) (*Account, error) {
	var acc Account
	var settingsJSON []byte
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, email, COALESCE(username, ''), full_name, account_type, COALESCE(account_status, 'ACTIVE'),
		       COALESCE(user_tier, 'FREE'), COALESCE(subscription_status, 'inactive'), subscription_expires_at,
		       COALESCE(whatsapp_phone, ''), country, COALESCE(kyc_status, ''),
		       CASE 
		           WHEN onboarding_completed = true 
		                AND (onboarding_data IS NULL OR onboarding_data = '{}'::jsonb OR onboarding_data = 'null'::jsonb)
		           THEN false
		           ELSE onboarding_completed
		       END AS onboarding_completed,
		       onboarding_data, COALESCE(wallet_address, ''), COALESCE(settings, '{}'::jsonb), created_at 
		FROM accounts 
		WHERE id = $1
	`, accountID).Scan(
		&acc.ID, &acc.Email, &acc.Username, &acc.FullName, &acc.AccountType, &acc.AccountStatus,
		&acc.UserTier, &acc.SubscriptionStatus, &acc.SubscriptionExpires,
		&acc.WhatsappPhone, &acc.Country, &acc.KYCStatus,
		&acc.OnboardingCompleted, &acc.OnboardingData, &acc.WalletAddress, &settingsJSON, &acc.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if len(settingsJSON) > 0 {
		_ = json.Unmarshal(settingsJSON, &acc.Settings)
	}
	acc.TermsAccepted, acc.PrivacyAccepted, acc.KYCConsent = s.loadConsentSnapshotBestEffort(ctx, accountID)
	if acc.IsLocked() {
		return nil, fmt.Errorf("account locked")
	}
	return &acc, nil
}

// GetAccountInfo retrieves account details by ID (lightweight version for email/name)
func (s *Service) GetAccountInfo(ctx context.Context, accountID uuid.UUID, email *string, name *string) error {
	var emailVal, nameVal string
	err := s.db.Pool.QueryRow(ctx, "SELECT email, full_name FROM accounts WHERE id = $1", accountID).Scan(&emailVal, &nameVal)
	if err != nil {
		return err
	}
	if email != nil {
		*email = emailVal
	}
	if name != nil {
		*name = nameVal
	}
	return nil
}

type UpdateAccountInput struct {
	CompanyName       string `json:"company_name"`
	NotificationEmail string `json:"notification_email"`
	FullName          string `json:"full_name"`
	Email             string `json:"email"`
	PhoneNumber       string `json:"phone_number"`
	Username          string `json:"username"`
	Country           string `json:"country"`
	AccountType       string `json:"account_type"`
	Timezone          string `json:"timezone"`
	DefaultCurrency   string `json:"default_currency"`
}

func (s *Service) UpdateAccountProfile(ctx context.Context, accountID uuid.UUID, input UpdateAccountInput) (*Account, error) {
	fullName := input.FullName

	email := input.Email
	if email == "" {
		email = input.NotificationEmail
	}

	currentSettings := map[string]any{}
	var settingsJSON []byte
	if err := s.db.Pool.QueryRow(ctx, "SELECT COALESCE(settings, '{}'::jsonb) FROM accounts WHERE id = $1", accountID).Scan(&settingsJSON); err == nil && len(settingsJSON) > 0 {
		_ = json.Unmarshal(settingsJSON, &currentSettings)
	}
	if input.CompanyName != "" {
		currentSettings["company_name"] = input.CompanyName
	}
	if input.NotificationEmail != "" {
		currentSettings["notification_email"] = input.NotificationEmail
	}
	if input.Timezone != "" {
		currentSettings["timezone"] = input.Timezone
	}
	if input.DefaultCurrency != "" {
		currentSettings["default_currency"] = input.DefaultCurrency
	}

	var acc Account
	var updatedSettingsJSON []byte
	err := s.db.Pool.QueryRow(ctx, `
		UPDATE accounts 
		SET full_name = COALESCE(NULLIF($1, ''), full_name),
		    email = COALESCE(NULLIF($2, ''), email),
		    whatsapp_phone = COALESCE(NULLIF($3, ''), whatsapp_phone),
		    username = COALESCE(NULLIF($4, ''), username),
		    country = COALESCE(NULLIF($5, ''), country),
		    account_type = COALESCE(NULLIF($6, '')::account_type, account_type),
		    settings = $7::jsonb,
		    updated_at = NOW()
		WHERE id = $8
		RETURNING id, email, COALESCE(username, ''), full_name, account_type, COALESCE(account_status, 'ACTIVE'),
		          COALESCE(user_tier, 'FREE'), COALESCE(subscription_status, 'inactive'), subscription_expires_at,
		          COALESCE(whatsapp_phone, ''), country, COALESCE(kyc_status, ''),
		          CASE 
		              WHEN onboarding_completed = true 
		                   AND (onboarding_data IS NULL OR onboarding_data = '{}'::jsonb OR onboarding_data = 'null'::jsonb)
		              THEN false
		              ELSE onboarding_completed
		          END AS onboarding_completed,
		          onboarding_data, COALESCE(wallet_address, ''), COALESCE(settings, '{}'::jsonb), created_at
	`, fullName, email, input.PhoneNumber, input.Username, input.Country, input.AccountType, jsonbString(currentSettings), accountID).Scan(
		&acc.ID, &acc.Email, &acc.Username, &acc.FullName, &acc.AccountType, &acc.AccountStatus,
		&acc.UserTier, &acc.SubscriptionStatus, &acc.SubscriptionExpires,
		&acc.WhatsappPhone, &acc.Country, &acc.KYCStatus,
		&acc.OnboardingCompleted, &acc.OnboardingData, &acc.WalletAddress, &updatedSettingsJSON, &acc.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update account: %w", err)
	}
	if len(updatedSettingsJSON) > 0 {
		_ = json.Unmarshal(updatedSettingsJSON, &acc.Settings)
	}
	acc.TermsAccepted, acc.PrivacyAccepted, acc.KYCConsent = s.loadConsentSnapshotBestEffort(ctx, accountID)
	return &acc, nil
}

// GetWallets returns all wallets for an account
func (s *Service) GetWallets(ctx context.Context, accountID uuid.UUID) ([]Wallet, error) {
	rows, err := s.db.Pool.Query(ctx, "SELECT id, account_id, type, currency, balance, COALESCE(chain_address, ''), COALESCE(chain_network, ''), COALESCE(is_primary, false) FROM wallets WHERE account_id = $1", accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	wallets := []Wallet{}
	for rows.Next() {
		var w Wallet
		if err := rows.Scan(&w.ID, &w.AccountID, &w.Type, &w.Currency, &w.Balance, &w.ChainAddress, &w.ChainNetwork, &w.IsPrimary); err != nil {
			return nil, err
		}
		wallets = append(wallets, w)
	}
	return wallets, nil
}

// GetPrimaryWallet returns the primary wallet for a given currency
func (s *Service) GetPrimaryWallet(ctx context.Context, accountID uuid.UUID, currency string) (*Wallet, error) {
	var w Wallet
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, account_id, type, currency, balance, COALESCE(chain_address, ''), COALESCE(chain_network, ''), COALESCE(is_primary, false)
		FROM wallets
		WHERE account_id = $1 AND currency = $2 AND is_primary = true
	`, accountID, currency).Scan(&w.ID, &w.AccountID, &w.Type, &w.Currency, &w.Balance, &w.ChainAddress, &w.ChainNetwork, &w.IsPrimary)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

// CreateWallet creates a new wallet for an account, enforcing Premium limits
func (s *Service) CreateWallet(ctx context.Context, accountID uuid.UUID, currency CurrencyCode) (*Wallet, error) {
	if currency != CurrencyUSDC {
		currency = CurrencyUSDC
	}

	// 1. Check existing wallets (keep the call for authorization/consistency and future limits)
	if _, err := s.GetWallets(ctx, accountID); err != nil {
		return nil, err
	}

	return s.ensureStablecoinVault(ctx, accountID)
}

func (s *Service) ensureStablecoinVault(ctx context.Context, accountID uuid.UUID) (*Wallet, error) {
	var existing Wallet
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, account_id, type, currency, balance,
		       COALESCE(chain_address, ''), COALESCE(chain_network, ''), COALESCE(is_primary, false)
		FROM wallets
		WHERE account_id = $1 AND currency = 'USDC' AND type = 'ONCHAIN_STABLE'
		LIMIT 1
	`, accountID).Scan(&existing.ID, &existing.AccountID, &existing.Type, &existing.Currency, &existing.Balance, &existing.ChainAddress, &existing.ChainNetwork, &existing.IsPrimary)
	if err == nil {
		return &existing, nil
	}

	managed, err := s.CreateManagedWallet(ctx, accountID)
	if err != nil {
		return nil, err
	}

	_, err = s.db.Pool.Exec(ctx, `
		UPDATE wallets
		SET type = 'ONCHAIN_STABLE',
		    currency = 'USDC',
		    chain_address = $1,
		    chain_network = $2,
		    is_primary = true
		WHERE id = $3 AND account_id = $4
	`, managed.PublicKey, managed.Network, managed.WalletID, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to configure managed wallet: %w", err)
	}

	return &Wallet{
		ID:           managed.WalletID,
		AccountID:    accountID,
		Type:         WalletTypeOnChainStable,
		Currency:     CurrencyUSDC,
		Balance:      0,
		ChainAddress: managed.PublicKey,
		ChainNetwork: managed.Network,
		IsPrimary:    true,
	}, nil
}

// ConvertTreasuryAssets swaps balance from one wallet currency into the treasury USDC vault.
func (s *Service) ConvertTreasuryAssets(ctx context.Context, accountID uuid.UUID, fromCurrency, toCurrency string, amount float64) (map[string]any, error) {
	if amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than zero")
	}
	fromCurrency = strings.ToUpper(strings.TrimSpace(fromCurrency))
	toCurrency = strings.ToUpper(strings.TrimSpace(toCurrency))
	if fromCurrency == "" || toCurrency == "" {
		return nil, fmt.Errorf("source and target currencies are required")
	}
	fromCurrency = string(NormalizeCurrencyCode(fromCurrency))
	toCurrency = string(NormalizeCurrencyCode(toCurrency))

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var fromWalletID, toWalletID uuid.UUID
	var fromBalance float64
	var toBalance float64

	if err := tx.QueryRow(ctx, `
		SELECT id, balance
		FROM wallets
		WHERE account_id = $1 AND currency = $2
		FOR UPDATE
	`, accountID, fromCurrency).Scan(&fromWalletID, &fromBalance); err != nil {
		return nil, fmt.Errorf("source wallet not found for %s", fromCurrency)
	}

	if NormalizeCurrencyCode(toCurrency) == CurrencyUSDC {
		target, err := s.ensureStablecoinVault(ctx, accountID)
		if err != nil {
			return nil, err
		}
		toWalletID = target.ID
		toBalance = target.Balance
	} else {
		if err := tx.QueryRow(ctx, `
			SELECT id, balance
			FROM wallets
			WHERE account_id = $1 AND currency = $2
			FOR UPDATE
		`, accountID, toCurrency).Scan(&toWalletID, &toBalance); err != nil {
			return nil, fmt.Errorf("target wallet not found for %s", toCurrency)
		}
	}

	if fromBalance < amount {
		return nil, fmt.Errorf("insufficient funds")
	}

	converted, err := s.ConvertCurrency(ctx, amount, fromCurrency, toCurrency)
	if err != nil {
		return nil, err
	}

	newFromBalance := fromBalance - amount
	newToBalance := toBalance + converted

	if _, err := tx.Exec(ctx, `UPDATE wallets SET balance = $1 WHERE id = $2`, newFromBalance, fromWalletID); err != nil {
		return nil, fmt.Errorf("failed to debit source wallet: %w", err)
	}
	if _, err := tx.Exec(ctx, `UPDATE wallets SET balance = $1 WHERE id = $2`, newToBalance, toWalletID); err != nil {
		return nil, fmt.Errorf("failed to credit target wallet: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO transactions (sender_wallet_id, recipient_wallet_id, amount, currency, fee, status, message, visibility, context, total_amount)
		VALUES ($1, $2, $3, $4, 0, 'COMPLETED', $5, 'PRIVATE', $6::jsonb, $7)
	`, fromWalletID, toWalletID, amount, fromCurrency, fmt.Sprintf("Treasury conversion %s -> %s", fromCurrency, toCurrency), jsonbString(map[string]any{
		"kind": "treasury_conversion",
		"from": fromCurrency,
		"to":   toCurrency,
	}), converted)
	if err != nil {
		return nil, fmt.Errorf("failed to record conversion transaction: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return map[string]any{
		"success":          true,
		"from_currency":    fromCurrency,
		"to_currency":      toCurrency,
		"from_amount":      amount,
		"converted_amount": converted,
		"source_wallet_id": fromWalletID,
		"target_wallet_id": toWalletID,
	}, nil
}

// DeleteWallet removes an empty wallet from the account.
func (s *Service) DeleteWallet(ctx context.Context, accountID, walletID uuid.UUID) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var walletType WalletType
	var balance float64
	var chainAddress string
	if err := tx.QueryRow(ctx, `
		SELECT type, balance, COALESCE(chain_address, '')
		FROM wallets
		WHERE id = $1 AND account_id = $2
		FOR UPDATE
	`, walletID, accountID).Scan(&walletType, &balance, &chainAddress); err != nil {
		return fmt.Errorf("wallet not found: %w", err)
	}

	if balance != 0 {
		return fmt.Errorf("wallet must be empty before deletion")
	}

	if walletType == WalletTypeOnChainStable {
		_, _ = tx.Exec(ctx, `DELETE FROM managed_wallets WHERE wallet_id = $1 OR account_id = $2`, walletID, accountID)
		_, _ = tx.Exec(ctx, `UPDATE accounts SET wallet_address = NULLIF(wallet_address, $1) WHERE id = $2`, chainAddress, accountID)
	}

	res, err := tx.Exec(ctx, `DELETE FROM wallets WHERE id = $1 AND account_id = $2`, walletID, accountID)
	if err != nil {
		return fmt.Errorf("failed to delete wallet: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("wallet not found or unauthorized")
	}

	return tx.Commit(ctx)
}

// InternalTransfer moves money between TWO WALLETS
func (s *Service) InternalTransfer(ctx context.Context, fromWalletID, toWalletID uuid.UUID, amount float64, message string) (*Transaction, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Check Sender Balance and Currency
	var senderBalance float64
	var currency CurrencyCode
	err = tx.QueryRow(ctx, "SELECT balance, currency FROM wallets WHERE id = $1 FOR UPDATE", fromWalletID).Scan(&senderBalance, &currency)
	if err != nil {
		return nil, fmt.Errorf("sender wallet not found: %w", err)
	}

	// 3. Calculate Fee (0.5%)
	fee := amount * 0.005
	totalDebit := amount + fee

	if senderBalance < totalDebit {
		return nil, fmt.Errorf("insufficient funds to cover amount and fee (total: %.2f)", totalDebit)
	}

	// 4. Update Balances
	_, err = tx.Exec(ctx, "UPDATE wallets SET balance = balance - $1 WHERE id = $2", totalDebit, fromWalletID)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, "UPDATE wallets SET balance = balance + $1 WHERE id = $2", amount, toWalletID)
	if err != nil {
		return nil, err
	}

	// 5. Record Transaction
	var trans Transaction
	err = tx.QueryRow(ctx, `
		INSERT INTO transactions (sender_wallet_id, recipient_wallet_id, amount, fee, currency, status, message)
		VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6)
		RETURNING id, sender_wallet_id, recipient_wallet_id, amount, fee, currency, status, message, created_at
	`, fromWalletID, toWalletID, amount, fee, currency, message).Scan(
		&trans.ID, &trans.SenderWalletID, &trans.RecipientWalletID, &trans.Amount, &trans.Fee, &trans.Currency, &trans.Status, &trans.Message, &trans.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// 6. Distribute Revenue
	if fee > 0 {
		_ = s.DistributeRevenue(ctx, fee, string(currency))
	}

	return &trans, nil
}

// GetExchangeRate returns real-time rates for Borderless Pay
func (s *Service) GetExchangeRate(ctx context.Context, from, to string) (float64, error) {
	if from == to {
		return 1.0, nil
	}

	pair := fmt.Sprintf("%s_%s", from, to)

	// 1. Check Redis Cache (Distributed)
	if s.redis != nil {
		key := fmt.Sprintf("fx_rate:%s", pair)
		val, err := s.redis.Get(ctx, key).Result()
		if err == nil {
			if rate, err := strconv.ParseFloat(val, 64); err == nil {
				return rate, nil
			}
		}
	}

	// 2. Check In-Memory Cache (Local)
	if time.Now().Before(s.cacheExpiry) {
		if rate, ok := s.rateCache[pair]; ok {
			return rate, nil
		}
	}

	// 3. Return from Cache (even if refresh failed, we use the last known)
	if rate, ok := s.rateCache[pair]; ok {
		return rate, nil
	}

	// 4. Final attempt: Fetch live
	rate, err := s.fetchLiveRate(ctx, from, to)
	if err == nil {
		s.rateCache[pair] = rate
		if s.redis != nil {
			key := fmt.Sprintf("fx_rate:%s", pair)
			s.redis.Set(ctx, key, fmt.Sprintf("%f", rate), 1*time.Hour)
		}
		return rate, nil
	}

	return 0, fmt.Errorf("exchange rate not found for %s", pair)
}

func (s *Service) fetchLiveRate(ctx context.Context, from, to string) (float64, error) {
	pair := fmt.Sprintf("%s_%s", from, to)
	if rate, ok := s.rateCache[pair]; ok {
		return rate, nil
	}
	
	s.refreshRates(ctx)
	if rate, ok := s.rateCache[pair]; ok {
		return rate, nil
	}
	
	return 0, fmt.Errorf("rate not available for %s", pair)
}

func (s *Service) ConvertCurrency(ctx context.Context, amount float64, from, to string) (float64, error) {
	rate, err := s.GetExchangeRate(ctx, from, to)
	if err != nil {
		return 0, err
	}

	gross := roundMoney(amount * rate)
	spreadRate := s.getFXSpreadRate(from, to)
	if spreadRate <= 0 {
		return gross, nil
	}

	feeAmount := roundMoney(gross * spreadRate)
	net := roundMoney(gross - feeAmount)
	if feeAmount > 0 {
		if err := s.DistributeRevenue(ctx, feeAmount, strings.ToUpper(strings.TrimSpace(to))); err != nil {
			log.Printf("WARNING: failed to distribute FX spread revenue: %v", err)
		}
	}
	return net, nil
}

func (s *Service) getFXSpreadRate(from, to string) float64 {
	fromCode := NormalizeCurrencyCode(from)
	toCode := NormalizeCurrencyCode(to)
	if fromCode == "" || toCode == "" || fromCode == toCode {
		return 0
	}
	switch {
	case fromCode == CurrencyUSD && toCode == CurrencyKES:
		return 0.015
	case fromCode == CurrencyKES && toCode == CurrencyUSD:
		return 0.02
	case fromCode == CurrencyUSDC && toCode == CurrencyKES:
		return 0.015
	case fromCode == CurrencyKES && toCode == CurrencyUSDC:
		return 0.02
	default:
		return 0.0175
	}
}

func (s *Service) refreshRates(ctx context.Context) {
	log.Println("DEBUG: Refreshing exchange rates...")
	// Fiat Rates (USD-based)
	if s.exchangeRateURL != "" {
		resp, err := http.Get(s.exchangeRateURL)
		if err == nil {
			defer resp.Body.Close()
			var result struct {
				Rates map[string]float64 `json:"rates"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
				// We treat USD as USDC for these conversions
				if ksh, ok := result.Rates["KES"]; ok {
					s.rateCache["USDC_KES"] = ksh
					s.rateCache["KES_USDC"] = 1.0 / ksh
					log.Printf("DEBUG: Updated KES rate: %.2f", ksh)
				}
				if kwd, ok := result.Rates["KWD"]; ok {
					s.rateCache["USDC_KWD"] = kwd
					s.rateCache["KWD_USDC"] = 1.0 / kwd
					log.Printf("DEBUG: Updated KWD rate: %.4f", kwd)
				}
				if ngn, ok := result.Rates["NGN"]; ok {
					s.rateCache["USDC_NGN"] = ngn
					s.rateCache["NGN_USDC"] = 1.0 / ngn
					log.Printf("DEBUG: Updated NGN rate: %.2f", ngn)
				}
				if ghs, ok := result.Rates["GHS"]; ok {
					s.rateCache["USDC_GHS"] = ghs
					s.rateCache["GHS_USDC"] = 1.0 / ghs
					log.Printf("DEBUG: Updated GHS rate: %.2f", ghs)
				}
			}
		}
	}

	// SOL Rate
	if s.coinGeckoURL != "" {
		resp, err := http.Get(s.coinGeckoURL + "?ids=solana&vs_currencies=usd")
		if err == nil {
			defer resp.Body.Close()
			var result map[string]map[string]float64
			if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
				if sol, ok := result["solana"]["usd"]; ok {
					s.rateCache["SOL_USDC"] = sol
					s.rateCache["USDC_SOL"] = 1.0 / sol
					log.Printf("DEBUG: Updated SOL rate: %.2f", sol)
				}
			}
		}
	}

	s.cacheExpiry = time.Now().Add(1 * time.Hour)
}
