package config

import (
	"log"
	"strings"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

// Config holds the application's configuration.
type Config struct {
	DatabaseURL         string `envconfig:"DATABASE_URL" default:"postgres://postgres:postgres@localhost:5432/corridor_v2?sslmode=disable"`
	RedisURL            string `envconfig:"REDIS_URL" default:"redis://localhost:6379/0"`
	Port                string `envconfig:"PORT" default:"8080"`
	JWTSecret           string `envconfig:"JWT_SECRET" default:"super-secret-key-for-demo"`
	WalletEncryptionKey string `envconfig:"WALLET_ENCRYPTION_KEY" default:""`
	Circle              CircleConfig
	Solana              SolanaConfig
	Helius              HeliusConfig
	Stripe              StripeConfig
	Paystack            PaystackConfig
	LemonSqueezy        LemonSqueezyConfig
	OpenAI              OpenAIConfig
	Mpesa               MpesaConfig
	Intersend           IntersendConfig
	SMTP                SMTPConfig
	SES                 SESConfig
	ExchangeRateURL     string `envconfig:"EXCHANGE_RATE_URL" default:"https://open.er-api.com/v6/latest/USD"`
	CoinGeckoURL        string `envconfig:"COINGECKO_URL" default:"https://api.coingecko.com/api/v3/simple/price"`
}

type LemonSqueezyConfig struct {
	ApiKey            string `envconfig:"LEMON_SQUEEZY_API_KEY"`
	StoreSubdomain    string `envconfig:"LEMON_SQUEEZY_STORE_SUBDOMAIN"`
	StoreID           string `envconfig:"LEMON_SQUEEZY_STORE_ID"`
	WebhookSecret     string `envconfig:"LEMON_SQUEEZY_WEBHOOK_SECRET"`
	MonthlyVariantID  string `envconfig:"LEMON_SQUEEZY_MONTHLY_VARIANT_ID"`
	YearlyVariantID   string `envconfig:"LEMON_SQUEEZY_YEARLY_VARIANT_ID"`
	LifetimeVariantID string `envconfig:"LEMON_SQUEEZY_LIFETIME_VARIANT_ID"`
	PortalURL         string `envconfig:"LEMON_SQUEEZY_PORTAL_URL"`
}

type OpenAIConfig struct {
	APIKey  string `envconfig:"OPENAI_API_KEY"`
	Model   string `envconfig:"OPENAI_MODEL" default:"gpt-4o-mini"`
	BaseURL string `envconfig:"OPENAI_BASE_URL" default:"https://api.openai.com/v1"`
}

type CircleConfig struct {
	APIKey        string `envconfig:"API_KEY"`
	BaseURL       string `envconfig:"BASE_URL" default:"https://api-sandbox.circle.com"`
	WebhookSecret string `envconfig:"WEBHOOK_SECRET"`
}

type HeliusConfig struct {
	APIKey          string `envconfig:"API_KEY"`
	APIKeySecondary string `envconfig:"API_KEY_SECONDARY"`
	BaseURL         string `envconfig:"BASE_URL" default:"https://api-mainnet.helius-rpc.com/v0"`
}

type SolanaConfig struct {
	RPCURL       string `envconfig:"RPC_URL" default:"https://api.devnet.solana.com"`
	WSURL        string `envconfig:"WS_URL" default:"wss://api.devnet.solana.com"`
	MasterWallet string `envconfig:"MASTER_WALLET"`
	PrivateKey   string `envconfig:"SOLANA_PRIVATE_KEY"` // Base58 encoded private key
}

type StripeConfig struct {
	SecretKey string `envconfig:"SECRET_KEY"`
}

type MpesaConfig struct {
	ConsumerKey    string `envconfig:"CONSUMER_KEY"`
	ConsumerSecret string `envconfig:"CONSUMER_SECRET"`
	Passkey        string `envconfig:"PASSKEY"`
	Shortcode      string `envconfig:"SHORTCODE"`
	Env            string `envconfig:"ENV" default:"sandbox"`
}

type IntersendConfig struct {
	APIKey    string `envconfig:"API_KEY"`
	FromEmail string `envconfig:"FROM_EMAIL" default:"noreply@corridormoney.net"`
}

type PaystackConfig struct {
	PublicKey string `envconfig:"PUBLIC_KEY"`
	SecretKey string `envconfig:"SECRET_KEY"`
}

type SMTPConfig struct {
	Host     string `envconfig:"HOST" default:"smtp.gmail.com"`
	Port     int    `envconfig:"PORT" default:"587"`
	Username string `envconfig:"USERNAME"` // people@corridormoney.net
	Password string `envconfig:"PASSWORD"`
	From     string `envconfig:"FROM" default:"people@corridormoney.net"`
}

type SESConfig struct {
	AccessKeyID     string `envconfig:"ACCESS_KEY_ID"`
	SecretAccessKey string `envconfig:"SECRET_ACCESS_KEY"`
	Region          string `envconfig:"REGION" default:"us-east-1"`
	From            string `envconfig:"FROM" default:"people@corridormoney.net"`
}

// Load loads the configuration from environment variables.
func Load() (*Config, error) {
	// Load env files: backend .env takes priority, then root .env
	// Use Overload to ensure file values win over inherited shell environment
	godotenv.Overload("../.env")
	godotenv.Overload("../../.env")
	godotenv.Overload("env")
	godotenv.Overload("../env")
	godotenv.Overload("../../env")
	godotenv.Overload(".env")

	var cfg Config
	// Remove prefix to match the provided .env file exactly
	// envconfig will use the struct field name as prefix for nested structs.
	// So Config.Circle.APIKey looks for CIRCLE_API_KEY.
	err := envconfig.Process("", &cfg)

	// Normalize DatabaseURL (handle SQLAlchemy format often found in env vars)
	if strings.HasPrefix(cfg.DatabaseURL, "postgresql+psycopg2://") {
		cfg.DatabaseURL = strings.Replace(cfg.DatabaseURL, "postgresql+psycopg2://", "postgres://", 1)
	}

	if err != nil {
		return nil, err
	}

	// Trim whitespace from keys
	cfg.Circle.APIKey = strings.TrimSpace(cfg.Circle.APIKey)
	cfg.Stripe.SecretKey = strings.TrimSpace(cfg.Stripe.SecretKey)
	cfg.Intersend.APIKey = strings.TrimSpace(cfg.Intersend.APIKey)
	cfg.LemonSqueezy.ApiKey = strings.TrimSpace(cfg.LemonSqueezy.ApiKey)
	cfg.LemonSqueezy.StoreSubdomain = strings.TrimSpace(cfg.LemonSqueezy.StoreSubdomain)
	cfg.LemonSqueezy.StoreID = strings.TrimSpace(cfg.LemonSqueezy.StoreID)
	cfg.LemonSqueezy.WebhookSecret = strings.TrimSpace(cfg.LemonSqueezy.WebhookSecret)
	cfg.LemonSqueezy.MonthlyVariantID = strings.TrimSpace(cfg.LemonSqueezy.MonthlyVariantID)
	cfg.LemonSqueezy.YearlyVariantID = strings.TrimSpace(cfg.LemonSqueezy.YearlyVariantID)
	cfg.LemonSqueezy.LifetimeVariantID = strings.TrimSpace(cfg.LemonSqueezy.LifetimeVariantID)
	cfg.LemonSqueezy.PortalURL = strings.TrimSpace(cfg.LemonSqueezy.PortalURL)
	cfg.OpenAI.APIKey = strings.TrimSpace(cfg.OpenAI.APIKey)
	cfg.OpenAI.Model = strings.TrimSpace(cfg.OpenAI.Model)
	cfg.OpenAI.BaseURL = strings.TrimSpace(cfg.OpenAI.BaseURL)

	// Debug: Verify Circle Key loading (safely)
	if cfg.Circle.APIKey == "" {
		log.Println("WARNING: CIRCLE_API_KEY is empty")
	} else {
		parts := strings.Split(cfg.Circle.APIKey, ":")
		log.Printf("DEBUG: CIRCLE_API_KEY loaded, length: %d, parts: %d", len(cfg.Circle.APIKey), len(parts))
	}

	return &cfg, nil
}

// MustLoad loads the configuration and panics on error.
func MustLoad() *Config {
	cfg, err := Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}
	return cfg
}
