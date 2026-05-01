package core

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type AccountType string
type WalletType string
type CurrencyCode string
type TransactionStatus string
type ContextKey string

const AccountContextKey ContextKey = "account"

const (
	AccountTypePersonal   AccountType = "PERSONAL"
	AccountTypeBusiness   AccountType = "BUSINESS"
	AccountTypeEnterprise AccountType = "ENTERPRISE"
	AccountTypeAdmin      AccountType = "ADMIN"

	AccountStatusActive    = "ACTIVE"
	AccountStatusLocked    = "LOCKED"
	AccountStatusSuspended = "SUSPENDED"

	WalletTypeInternalFiat  WalletType = "INTERNAL_FIAT"
	WalletTypeOnChainStable WalletType = "ONCHAIN_STABLE" // USDC, etc.

	CurrencyUSD  CurrencyCode = "USD"
	CurrencyUSDC CurrencyCode = "USDC"
	CurrencySOL  CurrencyCode = "SOL"
	CurrencyKES  CurrencyCode = "KES"
	CurrencyNGN  CurrencyCode = "NGN"

	TxStatusPending   TransactionStatus = "PENDING"
	TxStatusCompleted TransactionStatus = "COMPLETED"
)

type Account struct {
	ID                  uuid.UUID      `json:"id"`
	Email               string         `json:"email"`
	Username            string         `json:"username,omitempty"`
	FullName            string         `json:"full_name"`
	AccountType         AccountType    `json:"account_type"`
	AccountStatus       string         `json:"account_status,omitempty"`
	UserTier            string         `json:"user_tier,omitempty"`
	SubscriptionStatus  string         `json:"subscription_status,omitempty"`
	SubscriptionExpires *time.Time     `json:"subscription_expires_at,omitempty"`
	WhatsappPhone       string         `json:"whatsapp_phone"`
	Country             string         `json:"country"`
	KYCStatus           string         `json:"kyc_status"`
	TermsAccepted       bool           `json:"terms_accepted"`
	PrivacyAccepted     bool           `json:"privacy_accepted"`
	KYCConsent          bool           `json:"kyc_consent"`
	OnboardingCompleted bool           `json:"onboarding_completed"`
	OnboardingData      any            `json:"onboarding_data,omitempty"`
	WalletAddress       string         `json:"wallet_address,omitempty"`
	Settings            map[string]any `json:"settings,omitempty"`
	CreatedAt           time.Time      `json:"created_at"`
}

func (a *Account) IsAdmin() bool {
	return a.AccountType == AccountTypeAdmin
}

func (a *Account) IsLocked() bool {
	switch strings.ToUpper(strings.TrimSpace(a.AccountStatus)) {
	case "", AccountStatusActive:
		return false
	default:
		return true
	}
}

type Wallet struct {
	ID           uuid.UUID    `json:"id"`
	AccountID    uuid.UUID    `json:"account_id"`
	Type         WalletType   `json:"type"`
	Currency     CurrencyCode `json:"currency"`
	Balance      float64      `json:"balance"`
	ChainAddress string       `json:"chain_address,omitempty"`
	ChainNetwork string       `json:"chain_network,omitempty"`
	IsPrimary    bool         `json:"is_primary,omitempty"`
}

type ManagedWallet struct {
	ID        uuid.UUID `json:"id"`
	AccountID uuid.UUID `json:"account_id"`
	WalletID  uuid.UUID `json:"wallet_id"`
	PublicKey string    `json:"public_key"`
	Network   string    `json:"network"`
	CreatedAt time.Time `json:"created_at"`
}

type Transaction struct {
	ID                uuid.UUID         `json:"id"`
	SenderWalletID    uuid.UUID         `json:"sender_wallet_id"`
	RecipientWalletID uuid.UUID         `json:"recipient_wallet_id"`
	Amount            float64           `json:"amount"`
	Fee               float64           `json:"fee,omitempty"`
	Currency          CurrencyCode      `json:"currency"`
	Status            TransactionStatus `json:"status"`
	Message           string            `json:"message,omitempty"`
	ActorName         string            `json:"actor_name,omitempty"`
	CreatedAt         time.Time         `json:"created_at"`
}

// EWA Domain
type EWASettings struct {
	ID                     uuid.UUID `json:"id"`
	AccountID              uuid.UUID `json:"account_id"`
	IsEnabled              bool      `json:"is_enabled"`
	PercentageAccessible   float64   `json:"percentage_accessible"`
	MaxWithdrawalPerPeriod float64   `json:"max_withdrawal_per_period"`
	TransactionFee         float64   `json:"transaction_fee"`
	CooldownPeriodDays     int       `json:"cooldown_period_days"`
}

type EWAEmployee struct {
	ID                 uuid.UUID `json:"id"`
	AccountID          uuid.UUID `json:"account_id"`
	ExternalEmployeeID string    `json:"external_employee_id"`
	FullName           string    `json:"full_name"`
	Email              string    `json:"email"`
	GrossSalary        float64   `json:"gross_salary"`
	Currency           string    `json:"currency"`
	CorridorOfMonth    int       `json:"pay_day_of_month"`
	IsActive           bool      `json:"is_active"`
}

type EWARequest struct {
	ID               uuid.UUID  `json:"id"`
	EmployeeID       uuid.UUID  `json:"employee_id"`
	AmountRequested  float64    `json:"amount_requested"`
	AmountDisbursed  float64    `json:"amount_disbursed"`
	FeeCharged       float64    `json:"fee_charged"`
	Status           string     `json:"status"`
	DisbursementTxID *uuid.UUID `json:"disbursement_tx_id,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

// Treasury Domain
type TreasuryConfig struct {
	ID             uuid.UUID `json:"id"`
	AccountID      uuid.UUID `json:"account_id"`
	SourceWalletID uuid.UUID `json:"source_wallet_id"`
	TargetWalletID uuid.UUID `json:"target_wallet_id"`
	SweepThreshold float64   `json:"sweep_threshold"`
	KeepBuffer     float64   `json:"keep_buffer"`
	IsActive       bool      `json:"is_active"`
}

// Social Goals Domain
type SocialGoal struct {
	ID            uuid.UUID `json:"id"`
	AccountID     uuid.UUID `json:"account_id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	TargetAmount  float64   `json:"target_amount"`
	CurrentAmount float64   `json:"current_amount"`
	Currency      string    `json:"currency"`
	ProductLink   string    `json:"product_link,omitempty"`
	ShareLink     string    `json:"share_link"`
	Status        string    `json:"status"`
	IsPublic      bool      `json:"is_public"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type GoalContribution struct {
	ID              uuid.UUID `json:"id"`
	GoalID          uuid.UUID `json:"goal_id"`
	ContributorName string    `json:"contributor_name"`
	ContributorInfo any       `json:"contributor_info,omitempty"`
	Amount          float64   `json:"amount"`
	Currency        string    `json:"currency"`
	TransactionID   uuid.UUID `json:"transaction_id"`
	CreatedAt       time.Time `json:"created_at"`
}

type SocialConnection struct {
	FollowerID  uuid.UUID `json:"follower_id"`
	FollowingID uuid.UUID `json:"following_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type SocialAccountSummary struct {
	ID          uuid.UUID   `json:"id"`
	FullName    string      `json:"full_name"`
	Username    string      `json:"username,omitempty"`
	Email       string      `json:"email,omitempty"`
	AccountType AccountType `json:"account_type"`
	Country     string      `json:"country,omitempty"`
	Following   bool        `json:"following,omitempty"`
	CreatedAt   time.Time   `json:"created_at"`
}

type FundingSource struct {
	ID         uuid.UUID `json:"id"`
	AccountID  uuid.UUID `json:"account_id"`
	Type       string    `json:"type"`
	Last4      string    `json:"last4,omitempty"`
	Expiry     string    `json:"expiry,omitempty"`
	Brand      string    `json:"brand,omitempty"`
	ExternalID string    `json:"external_id,omitempty"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Plan struct {
	ID       uuid.UUID      `json:"id"`
	Name     string         `json:"name"`
	Price    float64        `json:"price"`
	Features map[string]any `json:"features"`
}

type Subscription struct {
	ID               uuid.UUID  `json:"id"`
	AccountID        uuid.UUID  `json:"account_id"`
	PlanID           uuid.UUID  `json:"plan_id"`
	Status           string     `json:"status"`
	CurrentPeriodEnd *time.Time `json:"current_period_end"`
	CreatedAt        time.Time  `json:"created_at"`
}
