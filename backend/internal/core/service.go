package core

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	crand "crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/corridrlabs/corridor/backend/internal/adapters/db"
	"github.com/corridrlabs/corridor/backend/internal/circle"
	"github.com/corridrlabs/corridor/backend/internal/email"
	"github.com/corridrlabs/corridor/backend/internal/notifications"
	"github.com/corridrlabs/corridor/backend/internal/solana"
	"github.com/corridrlabs/corridor/backend/pkg/config"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/paymentintent"
)

type Service struct {
	db              *db.Postgres
	circle          *circle.Client
	solanaClient    *solana.Client
	solanaConfig    config.SolanaConfig
	mpesa           config.MpesaConfig
	intersend       config.IntersendConfig
	openAI          config.OpenAIConfig
	email           *email.Service
	notifications   *notifications.Service
	jwtSecret       string
	exchangeRateURL string
	coinGeckoURL    string
	rateCache       map[string]float64
	cacheExpiry     time.Time
	redis           *redis.Client
	walletKey       []byte
}

func NewService(db *db.Postgres, redis *redis.Client, circle *circle.Client, solClient *solana.Client, solCfg config.SolanaConfig, mpesa config.MpesaConfig, intersend config.IntersendConfig, openAI config.OpenAIConfig, emailSvc *email.Service, notifySvc *notifications.Service, jwtSecret, walletEncryptionKey, exchangeRateURL, coinGeckoURL string) *Service {
	return &Service{
		db:              db,
		redis:           redis,
		circle:          circle,
		solanaClient:    solClient,
		solanaConfig:    solCfg,
		mpesa:           mpesa,
		intersend:       intersend,
		openAI:          openAI,
		email:           emailSvc,
		notifications:   notifySvc,
		jwtSecret:       jwtSecret,
		walletKey:       deriveWalletKey(walletEncryptionKey, jwtSecret),
		exchangeRateURL: exchangeRateURL,
		coinGeckoURL:    coinGeckoURL,
		rateCache:       make(map[string]float64),
	}
}

func deriveWalletKey(walletEncryptionKey, jwtSecret string) []byte {
	raw := strings.TrimSpace(walletEncryptionKey)
	if raw != "" {
		if decoded, err := base64.StdEncoding.DecodeString(raw); err == nil && len(decoded) == 32 {
			return decoded
		}
		sum := sha256.Sum256([]byte(raw))
		return sum[:]
	}
	sum := sha256.Sum256([]byte(jwtSecret))
	return sum[:]
}

func (s *Service) encryptWalletSecret(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.walletKey)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := crand.Read(nonce); err != nil {
		return "", err
	}
	ciphertext := gcm.Seal(nil, nonce, []byte(plaintext), nil)
	payload := append(nonce, ciphertext...)
	return base64.StdEncoding.EncodeToString(payload), nil
}

// BrandedMessage prepends the Corridor Labs branding and a unique reference code.
func (s *Service) BrandedMessage(ctx context.Context, baseMessage string) string {
	ref := strings.ToUpper(s.generateRefCode(8))
	return fmt.Sprintf("[Ref %s] Corridor Labs confirmed: %s", ref, baseMessage)
}

func (s *Service) generateRefCode(n int) string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Ambiguity-free
	b := make([]byte, n)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

// --- Auth Real Implementation ---

func (s *Service) GetDB() *db.Postgres {
	return s.db
}

func (s *Service) CheckUserExists(ctx context.Context, email, phone, idNumber string) (bool, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	phone = strings.TrimSpace(phone)
	idNumber = strings.TrimSpace(idNumber)
	var count int
	err := s.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM accounts
		WHERE lower(email) = lower($1)
		   OR ($2 <> '' AND whatsapp_phone = $2)
		   OR ($3 <> '' AND kyc_id_number = $3)
	`, email, phone, idNumber).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *Service) GetAccountIDByEmail(ctx context.Context, email string) (uuid.UUID, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	var id uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "SELECT id FROM accounts WHERE lower(email) = lower($1)", email).Scan(&id)
	if err != nil {
		return uuid.Nil, err
	}
	return id, nil
}

func (s *Service) SendVerificationCode(ctx context.Context, channel, contact string) error {
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	// Store in Redis with 10 minute expiration (if Redis is available)
	key := fmt.Sprintf("otp:%s", contact)
	if s.redis != nil {
		err := s.redis.Set(ctx, key, code, 10*time.Minute).Err()
		if err != nil {
			return fmt.Errorf("failed to save verification code to redis: %w", err)
		}
		fmt.Printf(">>> CLOUD OTP FOR %s: %s (Redis Set Successful)\n", contact, code)
	} else {
		// Fallback: log the code (in production, use database)
		fmt.Printf(">>> OTP FOR %s: %s (Redis not configured - check logs)\n", contact, code)
	}
	return nil
}

func (s *Service) VerifyCode(ctx context.Context, contact, code string) (bool, error) {
	key := fmt.Sprintf("otp:%s", contact)
	if s.redis != nil {
		val, err := s.redis.Get(ctx, key).Result()
		if err != nil {
			if err == redis.Nil {
				return false, nil // Expired or not found
			}
			return false, err
		}

		if val == code {
			s.redis.Del(ctx, key)
			return true, nil
		}
	}

	// If Redis is not configured, accept any 6-digit code for development
	// In production with Redis, this won't be reached
	return false, nil
}

func (s *Service) GoogleLogin(ctx context.Context, token string) (*AuthResponse, error) {
	return nil, errors.New("google login not implemented in demo")
}

// --- Onboarding & Preferences ---

func hasMeaningfulOnboardingData(prefs any) bool {
	if prefs == nil {
		return false
	}

	switch v := prefs.(type) {
	case map[string]any:
		if len(v) == 0 {
			return false
		}
	case []any:
		if len(v) == 0 {
			return false
		}
	}

	b, err := json.Marshal(prefs)
	if err != nil {
		return false
	}

	s := string(bytes.TrimSpace(b))
	return s != "null" && s != "{}" && s != "[]"
}

func (s *Service) SaveOnboardingPreferences(ctx context.Context, accountID uuid.UUID, prefs any) (bool, error) {
	prefsJSON, err := json.Marshal(prefs)
	if err != nil {
		return false, fmt.Errorf("failed to marshal preferences: %w", err)
	}
	completed := hasMeaningfulOnboardingData(prefs)
	prefsStr := string(prefsJSON)

	// 1. Update accounts table
	_, err = s.db.Pool.Exec(ctx, "UPDATE accounts SET onboarding_data = $1, onboarding_completed = $2 WHERE id = $3", prefsStr, completed, accountID)
	if err != nil {
		return false, fmt.Errorf("failed to update accounts table: %w", err)
	}

	// 2. Ensure onboarding_profiles exists and update it
	// We do this one-time check to handle existing databases on Render
	ensureTable := `
		CREATE TABLE IF NOT EXISTS onboarding_profiles (
			user_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
			preferences JSONB DEFAULT '{}'::jsonb,
			is_complete BOOLEAN DEFAULT FALSE,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)
	`
	_, _ = s.db.Pool.Exec(ctx, ensureTable)

	query := `
		INSERT INTO onboarding_profiles (user_id, preferences, is_complete, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (user_id) DO UPDATE SET 
			preferences = EXCLUDED.preferences,
			is_complete = EXCLUDED.is_complete,
			updated_at = EXCLUDED.updated_at
	`
	_, err = s.db.Pool.Exec(ctx, query, accountID, prefsStr, completed)
	if err != nil {
		fmt.Printf("Warning: failed to synchronize onboarding_profiles for %s: %v\n", accountID, err)
	}

	return completed, nil
}

func (s *Service) GetOnboardingStatus(ctx context.Context, accountID uuid.UUID) (any, error) {
	var completed bool
	err := s.db.Pool.QueryRow(ctx, "SELECT onboarding_completed FROM accounts WHERE id = $1", accountID).Scan(&completed)
	return map[string]bool{"completed": completed}, err
}

func (s *Service) UpdateWalletAddress(ctx context.Context, accountID uuid.UUID, address string) error {
	_, err := s.db.Pool.Exec(ctx, "UPDATE accounts SET wallet_address = $1 WHERE id = $2", address, accountID)
	return err
}

// --- Billing (Stripe) ---

func (s *Service) CreateStripePaymentIntent(ctx context.Context, amount int64, currency string) (string, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amount),
		Currency: stripe.String(currency),
	}
	pi, err := paymentintent.New(params)
	if err != nil {
		return "", err
	}
	return pi.ClientSecret, nil
}

// --- M-Pesa Integration ---

func (s *Service) TriggerMpesaSTKPush(ctx context.Context, phone string, amount float64) (string, error) {
	if s.mpesa.ConsumerKey == "" || s.mpesa.ConsumerSecret == "" {
		return "", errors.New("mpesa credentials not configured")
	}

	// 1. Get Access Token
	token, err := s.getMpesaToken()
	if err != nil {
		return "", err
	}

	// 2. Format Phone (254...)
	formattedPhone := phone
	if len(phone) == 10 && phone[0] == '0' {
		formattedPhone = "254" + phone[1:]
	}

	// 3. Prepare STK Push Request
	timestamp := time.Now().Format("20060102150405")
	password := base64.StdEncoding.EncodeToString([]byte(s.mpesa.Shortcode + s.mpesa.Passkey + timestamp))

	baseURL := "https://sandbox.safaricom.co.ke"
	if s.mpesa.Env == "production" {
		baseURL = "https://api.safaricom.co.ke"
	}

	reqBody := map[string]interface{}{
		"BusinessShortCode": s.mpesa.Shortcode,
		"Password":          password,
		"Timestamp":         timestamp,
		"TransactionType":   "CustomerPayBillOnline",
		"Amount":            int(amount),
		"PartyA":            formattedPhone,
		"PartyB":            s.mpesa.Shortcode,
		"PhoneNumber":       formattedPhone,
		"CallBackURL":       os.Getenv("MPESA_CALLBACK_URL"), // Dynamic callback URL
		"AccountReference":  "CorridorWallet",
		"TransactionDesc":   "Wallet Topup",
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequestWithContext(ctx, "POST", baseURL+"/mpesa/stkpush/v1/processrequest", bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("mpesa stk push failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response to get CheckoutRequestID
	var mpesaResp struct {
		MerchantRequestID   string `json:"MerchantRequestID"`
		CheckoutRequestID   string `json:"CheckoutRequestID"`
		ResponseCode        string `json:"ResponseCode"`
		ResponseDescription string `json:"ResponseDescription"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&mpesaResp); err != nil {
		// Even if we can't parse, we should still return the error but not fail the whole thing
		log.Printf("Warning: couldn't parse M-Pesa response: %v", err)
		return "", nil
	}

	// Store the pending transaction mapping for callback handling
	// This is used to link M-Pesa callbacks to specific transactions (wallet topups, payment links, etc.)
	if mpesaResp.CheckoutRequestID != "" {
		_, err = s.db.Pool.Exec(ctx, `
			INSERT INTO pending_mpesa_transactions (merchant_request_id, checkout_request_id, phone_number, amount, status)
			VALUES ($1, $2, $3, $4, 'PENDING')
			ON CONFLICT (checkout_request_id) DO NOTHING
		`, mpesaResp.MerchantRequestID, mpesaResp.CheckoutRequestID, formattedPhone, amount)
		if err != nil {
			log.Printf("Warning: failed to store pending M-Pesa transaction: %v", err)
		}
	}

	return mpesaResp.CheckoutRequestID, nil
}

// TriggerMpesaB2C sends money from business account to customer (salary/payout)
func (s *Service) TriggerMpesaB2C(ctx context.Context, phone string, amount float64, reference string) error {
	if s.mpesa.ConsumerKey == "" || s.mpesa.ConsumerSecret == "" {
		return errors.New("mpesa credentials not configured")
	}

	token, err := s.getMpesaToken()
	if err != nil {
		return err
	}

	formattedPhone := phone
	if len(phone) == 10 && phone[0] == '0' {
		formattedPhone = "254" + phone[1:]
	}

	baseURL := "https://sandbox.safaricom.co.ke"
	if s.mpesa.Env == "production" {
		baseURL = "https://api.safaricom.co.ke"
	}

	// B2C requires a different approach - using USSD push or direct API
	reqBody := map[string]interface{}{
		"OriginatorConversationID": uuid.New().String(),
		"InitiatorName":            os.Getenv("MPESA_INITIATOR_NAME"),
		"SecurityCredential":       os.Getenv("MPESA_SECURITY_CREDENTIAL"),
		"CommandID":                "BusinessPayment", // or SalaryPayment, PromotionPayment
		"Amount":                   int(amount),
		"PartyA":                   s.mpesa.Shortcode,
		"PartyB":                   formattedPhone,
		"Remarks":                  reference,
		"QueueTimeOutURL":          os.Getenv("MPESA_B2C_TIMEOUT_URL"),
		"ResultURL":                os.Getenv("MPESA_B2C_RESULT_URL"),
		"Occasion":                 reference,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequestWithContext(ctx, "POST", baseURL+"/mpesa/b2c/v1/send", bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("mpesa b2c failed: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (s *Service) getMpesaToken() (string, error) {
	url := "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
	if s.mpesa.Env == "production" {
		url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
	}

	req, _ := http.NewRequest("GET", url, nil)
	auth := base64.StdEncoding.EncodeToString([]byte(s.mpesa.ConsumerKey + ":" + s.mpesa.ConsumerSecret))
	req.Header.Set("Authorization", "Basic "+auth)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var res struct {
		AccessToken string `json:"access_token"`
	}
	json.NewDecoder(resp.Body).Decode(&res)
	return res.AccessToken, nil
}

// --- Intersend (Email) ---

func (s *Service) SendEmail(to, subject, body string) error {
	if s.intersend.APIKey == "" {
		return nil
	}

	reqBody := map[string]interface{}{
		"to":      []string{to},
		"from":    s.intersend.FromEmail,
		"subject": subject,
		"body":    body,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "https://api.intersend.io/v1/send", bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+s.intersend.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// --- Settings & Rest ---

func (s *Service) GetAccountSettings(ctx context.Context, accountID uuid.UUID) (map[string]interface{}, error) {
	var settingsJSON []byte
	err := s.db.Pool.QueryRow(ctx, "SELECT COALESCE(settings, '{}') FROM accounts WHERE id = $1", accountID).Scan(&settingsJSON)
	if err != nil {
		return nil, err
	}
	var settings map[string]interface{}
	json.Unmarshal(settingsJSON, &settings)
	return settings, nil
}

func (s *Service) UpdateAccountSettings(ctx context.Context, accountID uuid.UUID, newSettings map[string]interface{}) (map[string]interface{}, error) {
	existing, _ := s.GetAccountSettings(ctx, accountID)
	if existing == nil {
		existing = make(map[string]interface{})
	}
	for k, v := range newSettings {
		existing[k] = v
	}
	settingsJSON, _ := json.Marshal(existing)
	_, err := s.db.Pool.Exec(ctx, "UPDATE accounts SET settings = $1 WHERE id = $2", settingsJSON, accountID)
	return existing, err
}

func (s *Service) GetNotifications(accountID uuid.UUID) []notifications.Notification {
	return s.notifications.GetWebNotifications(accountID)
}

func (s *Service) SendNotification(ctx context.Context, accountID uuid.UUID, title, message string, nType notifications.NotificationType) error {
	return s.notifications.Notify(ctx, accountID, title, message, nType)
}

func (s *Service) CalculateFee(amount float64, txType string) float64 {
	switch txType {
	case "SOLANA_WITHDRAW":
		fee := amount * 0.005
		if fee < 0.10 {
			return 0.10 // 0.10 USD
		}
		return fee
	case "EWA":
		return 2.50 // 2.50 USD Flat fee per EWA withdrawal
	case "SOCIAL_GOAL":
		return amount * 0.01 // 1.0%
	default:
		return amount * 0.01 // 1% Default platform fee
	}
}

// CalculateTransactionFee returns the granular fee based on the payment rail used.
func (s *Service) CalculateTransactionFee(amount float64, rail string) float64 {
	switch strings.ToLower(rail) {
	case "stablecoin", "crypto", "usdc": // USDC, USDT, cUSD
		fee := amount * 0.001 // 0.1%
		if fee > 1.0 {
			fee = 1.0 // Capped at $1
		}
		return fee
	case "mobile_money", "mpesa": // M-PESA, Airtel, MTN
		return amount * 0.01 // 1.0%
	case "bank_transfer", "swift", "local_bank": // Local & SWIFT
		fee := amount * 0.005 // 0.5%
		if fee < 0.50 {
			fee = 0.50 // Min $0.50
		}
		if fee > 50.0 {
			fee = 50.0 // Max $50
		}
		return fee
	case "card": // Visa, Mastercard
		return (amount * 0.029) + 0.30 // 2.9% + $0.30
	default:
		return s.CalculateFee(amount, "")
	}
}

// CalculateEWAWithdrawalFee returns the flat fee charged per EWA withdrawal.
func (s *Service) CalculateEWAWithdrawalFee(_ float64, _ float64) float64 {
	return 200.0
}

// CalculateSocialContributionFee returns the platform fee for crowdfunding contributions (1.0%).
func (s *Service) CalculateSocialContributionFee(amount float64) float64 {
	if amount <= 0 {
		return 0
	}
	return amount * 0.01
}

func (s *Service) ProcessSolanaWithdraw(ctx context.Context, accountID uuid.UUID, destination string, amount float64, currency string) error {
	return errors.New("solana withdrawal not implemented")
}

func (s *Service) RecordFeatureUsage(ctx context.Context, accountID uuid.UUID, feature string) {
	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO feature_usage (account_id, feature, usage_date, count)
		VALUES ($1, $2, CURRENT_DATE, 1)
		ON CONFLICT (account_id, feature, usage_date)
		DO UPDATE SET count = feature_usage.count + 1
	`, accountID, feature)
	if err != nil {
		log.Printf("ERROR: failed to record feature usage: %v", err)
	}
}
