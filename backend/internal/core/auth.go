package core

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// BcryptCost defines the computational cost for bcrypt hashing
const BcryptCost = 12

type Claims struct {
	AccountID uuid.UUID `json:"account_id"`
	Email     string    `json:"email"`
	jwt.RegisteredClaims
}

type AuthResponse struct {
	AccessToken string   `json:"access_token"`
	TokenType   string   `json:"token_type"`
	User        *Account `json:"user"`
}

// HashPassword generates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	// Bcrypt has a 72-byte limit. To handle longer passwords safely,
	// we hash the password with SHA-256 first.
	pwHash := sha256.Sum256([]byte(password))
	hash, err := bcrypt.GenerateFromPassword(pwHash[:], BcryptCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword compares a password with its hash
func CheckPassword(password, hash string) bool {
	pwHash := sha256.Sum256([]byte(password))
	if err := bcrypt.CompareHashAndPassword([]byte(hash), pwHash[:]); err == nil {
		return true
	}

	// Legacy compatibility: older accounts were stored with direct bcrypt(password).
	// Keep accepting those hashes so existing users can still sign in after the
	// stronger SHA-256 prehash rollout.
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// CreateAccount registers a new user and returns Auth Response
func (s *Service) CreateAccount(ctx context.Context, email, name, password, phone, country, idType, idNumber string, acceptTerms, acceptPrivacy, acceptKYC bool, accType AccountType) (*AuthResponse, error) {
	var id uuid.UUID
	var createdAt time.Time
	email = normalizeEmail(email)
	phone = strings.TrimSpace(phone)
	country = strings.TrimSpace(country)
	idType = strings.TrimSpace(idType)
	idNumber = strings.TrimSpace(idNumber)

	// Hash password with bcrypt
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	err = s.db.Pool.QueryRow(ctx, `
		INSERT INTO accounts (email, full_name, password_hash, account_type, whatsapp_phone, country, kyc_id_type, kyc_id_number, kyc_captured_at, onboarding_completed, user_tier, subscription_status, account_status)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), NOW(), false, 'FREE', 'inactive', 'ACTIVE')
		RETURNING id, created_at
	`, email, name, hashedPassword, accType, phone, country, idType, idNumber).Scan(&id, &createdAt)
	if err != nil {
		return nil, err
	}

	_ = s.RecordConsent(ctx, id, ConsentTypeTOS, "1.0", acceptTerms, "", "", map[string]interface{}{
		"source": "registration",
	})
	_ = s.RecordConsent(ctx, id, ConsentTypePrivacy, "1.0", acceptPrivacy, "", "", map[string]interface{}{
		"source": "registration",
	})
	_ = s.RecordConsent(ctx, id, ConsentTypeKYC, "1.0", acceptKYC, "", "", map[string]interface{}{
		"source": "registration",
	})

	// Initialize onboarding profile
	_, err = s.CreateOnboardingProfile(ctx, id, IntentFullPlatform)
	if err != nil {
		// Log error but don't fail account creation
		fmt.Printf("Warning: failed to create onboarding profile for %s: %v\n", id, err)
	}

	acc := Account{
		ID:            id,
		Email:         email,
		FullName:      name,
		AccountType:   accType,
		AccountStatus: AccountStatusActive,
		Country:       country,
		TermsAccepted:  acceptTerms,
		PrivacyAccepted: acceptPrivacy,
		KYCConsent:     acceptKYC,
		CreatedAt:     createdAt,
	}

	token, err := s.generateToken(acc)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		User:        &acc,
	}, nil
}

// Login verifies user and returns token
func (s *Service) Login(ctx context.Context, email, password string) (*AuthResponse, error) {
	email = normalizeEmail(email)
	var acc Account
	var dbHash string
	var settingsJSON []byte
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, email, COALESCE(username, ''), full_name, password_hash, account_type, COALESCE(account_status, 'ACTIVE'),
		       COALESCE(user_tier, 'FREE'), COALESCE(subscription_status, 'inactive'), subscription_expires_at,
		       COALESCE(whatsapp_phone, ''), country, COALESCE(kyc_status, ''),
		       CASE 
		           WHEN onboarding_completed = true 
		                AND (onboarding_data IS NULL OR onboarding_data = '{}'::jsonb OR onboarding_data = 'null'::jsonb)
		           THEN false
		           ELSE onboarding_completed
		       END AS onboarding_completed,
		       onboarding_data, COALESCE(wallet_address, ''), COALESCE(settings, '{}'::jsonb), created_at
		FROM accounts WHERE lower(email) = lower($1)
	`, email).Scan(
		&acc.ID, &acc.Email, &acc.Username, &acc.FullName, &dbHash, &acc.AccountType, &acc.AccountStatus,
		&acc.UserTier, &acc.SubscriptionStatus, &acc.SubscriptionExpires,
		&acc.WhatsappPhone, &acc.Country, &acc.KYCStatus,
		&acc.OnboardingCompleted, &acc.OnboardingData, &acc.WalletAddress, &settingsJSON, &acc.CreatedAt,
	)

	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	if len(settingsJSON) > 0 {
		_ = json.Unmarshal(settingsJSON, &acc.Settings)
	}
	acc.TermsAccepted, acc.PrivacyAccepted, acc.KYCConsent = s.loadConsentSnapshotBestEffort(ctx, acc.ID)
	if acc.IsLocked() {
		return nil, errors.New("account locked")
	}

	// Use bcrypt to verify password
	if !CheckPassword(password, dbHash) {
		return nil, errors.New("invalid credentials")
	}

	token, err := s.generateToken(acc)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		User:        &acc,
	}, nil
}

// Authenticate verifies the token and returns the user
func (s *Service) Authenticate(ctx context.Context, tokenStr string) (*Account, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("unauthorized")
	}

	return s.GetAccountByID(ctx, claims.AccountID)
}

func (s *Service) generateToken(acc Account) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		AccountID: acc.ID,
		Email:     acc.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func nullableText(value string) any {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return trimmed
}
