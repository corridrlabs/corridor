package middleware

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// APIKeyContextKey is the context key for storing API key info
type APIKeyContextKey struct{}

// APIKeyInfo contains information about the authenticated API key
type APIKeyInfo struct {
	ID          string
	AccountID   string
	Name        string
	Permissions []string
}

// APIKeyAuthenticator validates API keys against the database
type APIKeyAuthenticator struct {
	db *pgxpool.Pool
}

// NewAPIKeyAuthenticator creates a new API key authenticator
func NewAPIKeyAuthenticator(db *pgxpool.Pool) *APIKeyAuthenticator {
	return &APIKeyAuthenticator{db: db}
}

// ValidateAPIKey checks if the provided API key is valid
func (a *APIKeyAuthenticator) ValidateAPIKey(ctx context.Context, apiKey string) (*APIKeyInfo, error) {
	// Hash the API key for comparison
	hash := sha256.Sum256([]byte(apiKey))
	keyHash := hex.EncodeToString(hash[:])

	var info APIKeyInfo
	var permissionsStr string

	err := a.db.QueryRow(ctx, `
		SELECT id, account_id, name, COALESCE(permissions, '') 
		FROM api_keys 
		WHERE key_hash = $1 AND revoked_at IS NULL
	`, keyHash).Scan(&info.ID, &info.AccountID, &info.Name, &permissionsStr)

	if err != nil {
		return nil, err
	}

	// Update last used timestamp
	go func() {
		_, _ = a.db.Exec(context.Background(),
			"UPDATE api_keys SET last_used_at = $1 WHERE id = $2",
			time.Now(), info.ID)
	}()

	// Parse permissions
	if permissionsStr != "" {
		info.Permissions = strings.Split(permissionsStr, ",")
	}

	return &info, nil
}

// Middleware returns an HTTP middleware that validates API keys
func (a *APIKeyAuthenticator) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")

		if apiKey == "" {
			// No API key provided, continue without API key auth
			// (other auth methods like Bearer token may be used)
			next.ServeHTTP(w, r)
			return
		}

		info, err := a.ValidateAPIKey(r.Context(), apiKey)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"error": "invalid API key"}`, http.StatusUnauthorized)
			return
		}

		// Apply API rate limiting for authenticated partners
		if !APILimiter.Allow(info.AccountID) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error": "rate limit exceeded"}`, http.StatusTooManyRequests)
			return
		}

		// Add API key info to context
		ctx := context.WithValue(r.Context(), APIKeyContextKey{}, info)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAPIKey returns middleware that requires a valid API key
func (a *APIKeyAuthenticator) RequireAPIKey(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")

		if apiKey == "" {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"error": "API key required"}`, http.StatusUnauthorized)
			return
		}

		info, err := a.ValidateAPIKey(r.Context(), apiKey)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"error": "invalid API key"}`, http.StatusUnauthorized)
			return
		}

		// Apply API rate limiting
		if !APILimiter.Allow(info.AccountID) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error": "rate limit exceeded"}`, http.StatusTooManyRequests)
			return
		}

		ctx := context.WithValue(r.Context(), APIKeyContextKey{}, info)
		next(w, r.WithContext(ctx))
	}
}

// RequirePermission returns middleware that requires a specific permission
func (a *APIKeyAuthenticator) RequirePermission(permission string, next http.HandlerFunc) http.HandlerFunc {
	return a.RequireAPIKey(func(w http.ResponseWriter, r *http.Request) {
		info, ok := r.Context().Value(APIKeyContextKey{}).(*APIKeyInfo)
		if !ok {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"error": "API key info not found"}`, http.StatusInternalServerError)
			return
		}

		// Check if the API key has the required permission
		hasPermission := false
		for _, p := range info.Permissions {
			if p == permission || p == "*" {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"error": "insufficient permissions"}`, http.StatusForbidden)
			return
		}

		next(w, r)
	})
}

// GetAPIKeyInfo extracts API key info from context
func GetAPIKeyInfo(ctx context.Context) *APIKeyInfo {
	info, ok := ctx.Value(APIKeyContextKey{}).(*APIKeyInfo)
	if !ok {
		return nil
	}
	return info
}

// HashAPIKey generates a SHA-256 hash of an API key
func HashAPIKey(apiKey string) string {
	hash := sha256.Sum256([]byte(apiKey))
	return hex.EncodeToString(hash[:])
}

// GenerateAPIKey generates a new API key with a prefix using crypto/rand
func GenerateAPIKey(prefix string) string {
	// Generate 32 cryptographically secure random bytes
	randomBytes := make([]byte, 32)
	_, err := rand.Read(randomBytes)
	if err != nil {
		// Fallback for extreme cases, though rand.Read should not fail
		return prefix + "_" + hex.EncodeToString(sha256.New().Sum([]byte(time.Now().String())))[:32]
	}
	hash := sha256.Sum256(randomBytes)
	return prefix + "_" + hex.EncodeToString(hash[:])[:32]
}
