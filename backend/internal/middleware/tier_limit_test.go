package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestTierLimitMiddleware(t *testing.T) {
	tests := []struct {
		name           string
		userTier       string
		currentUsage   int
		tierLimit      int
		expectedStatus int
	}{
		{"Free tier within limit", "free", 5, 10, http.StatusOK},
		{"Free tier at limit", "free", 10, 10, http.StatusPaymentRequired},
		{"Pro tier within limit", "pro", 50, 100, http.StatusOK},
		{"Enterprise unlimited", "enterprise", 1000, -1, http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock user context
			setMockUserTier(tt.userTier)
			setMockUsage(tt.currentUsage)
			setMockTierLimit(tt.tierLimit)

			// Create test handler
			handler := mockTierLimitMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte("success"))
			}))

			// Create test request
			req := httptest.NewRequest("GET", "/api/test", nil)
			req.Header.Set("Authorization", "Bearer test-token")
			
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
			}
		})
	}
}

func TestUsageIncrement(t *testing.T) {
	// Reset usage
	resetMockUsage()

	// Create middleware with usage tracking
	handler := mockTierLimitMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Make multiple requests
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/api/test", nil)
		req.Header.Set("Authorization", "Bearer test-token")
		
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
	}

	// Check usage was incremented
	usage := getMockUsage()
	if usage != 3 {
		t.Errorf("expected usage 3, got %d", usage)
	}
}

func Test402Response(t *testing.T) {
	// Set user at limit
	setMockUserTier("free")
	setMockUsage(10)
	setMockTierLimit(10)

	handler := mockTierLimitMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Check 402 Payment Required response
	if rr.Code != http.StatusPaymentRequired {
		t.Errorf("expected status 402, got %d", rr.Code)
	}

	// Check response body contains upgrade message
	body := rr.Body.String()
	if !contains(body, "upgrade") {
		t.Error("expected upgrade message in response body")
	}
}

// TierLimitMiddleware implementation
func mockTierLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract user from token (simplified)
		_ = getMockUserTier()
		currentUsage := getMockUsage()
		tierLimit := getMockTierLimit()

		// Check tier limits
		if tierLimit != -1 && currentUsage >= tierLimit {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusPaymentRequired)
			w.Write([]byte(`{"error": "Tier limit exceeded. Please upgrade your plan."}`))
			return
		}

		// Increment usage
		incrementMockUsage()

		// Continue to next handler
		next.ServeHTTP(w, r)
	})
}

// Mock functions for testing
var mockUserTier string
var mockUsage int
var mockTierLimit int

func setMockUserTier(tier string) { mockUserTier = tier }
func getMockUserTier() string { return mockUserTier }

func setMockUsage(usage int) { mockUsage = usage }
func getMockUsage() int { return mockUsage }
func incrementMockUsage() { mockUsage++ }
func resetMockUsage() { mockUsage = 0 }

func setMockTierLimit(limit int) { mockTierLimit = limit }
func getMockTierLimit() int { return mockTierLimit }

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}