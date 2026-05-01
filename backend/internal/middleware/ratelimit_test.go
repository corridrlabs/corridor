package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiterAllow(t *testing.T) {
	// Create a rate limiter: 5 requests per minute
	rl := NewRateLimiter(5, time.Minute)

	ip := "192.168.1.1"

	// First 5 requests should be allowed
	for i := 0; i < 5; i++ {
		if !rl.Allow(ip) {
			t.Errorf("Request %d should be allowed", i+1)
		}
	}

	// 6th request should be blocked
	if rl.Allow(ip) {
		t.Error("6th request should be blocked")
	}
}

func TestRateLimiterDifferentIPs(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)

	// Each IP should have its own bucket
	ip1 := "192.168.1.1"
	ip2 := "192.168.1.2"

	// Both IPs should be able to make requests
	if !rl.Allow(ip1) {
		t.Error("First request from ip1 should be allowed")
	}
	if !rl.Allow(ip2) {
		t.Error("First request from ip2 should be allowed")
	}
	if !rl.Allow(ip1) {
		t.Error("Second request from ip1 should be allowed")
	}
	if !rl.Allow(ip2) {
		t.Error("Second request from ip2 should be allowed")
	}

	// Both should now be blocked
	if rl.Allow(ip1) {
		t.Error("Third request from ip1 should be blocked")
	}
	if rl.Allow(ip2) {
		t.Error("Third request from ip2 should be blocked")
	}
}

func TestRateLimiterRefill(t *testing.T) {
	// Use a very short window for testing
	rl := NewRateLimiter(2, 100*time.Millisecond)

	ip := "192.168.1.1"

	// Use up the tokens
	rl.Allow(ip)
	rl.Allow(ip)

	// Should be blocked
	if rl.Allow(ip) {
		t.Error("Request should be blocked after exhausting tokens")
	}

	// Wait for refill
	time.Sleep(150 * time.Millisecond)

	// Should be allowed again
	if !rl.Allow(ip) {
		t.Error("Request should be allowed after window reset")
	}
}

func TestRateLimitHandler(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)

	handler := rl.RateLimitHandler(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Create test requests
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.1:12345"
		w := httptest.NewRecorder()

		handler(w, req)

		if i < 2 {
			if w.Code != http.StatusOK {
				t.Errorf("Request %d: expected status 200, got %d", i+1, w.Code)
			}
		} else {
			if w.Code != http.StatusTooManyRequests {
				t.Errorf("Request %d: expected status 429, got %d", i+1, w.Code)
			}
		}
	}
}

func TestRateLimitMiddleware(t *testing.T) {
	rl := NewRateLimiter(1, time.Minute)

	baseHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := rl.Middleware(baseHandler)

	// First request should succeed
	req1 := httptest.NewRequest("GET", "/test", nil)
	req1.RemoteAddr = "10.0.0.1:12345"
	w1 := httptest.NewRecorder()
	handler.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Errorf("First request: expected 200, got %d", w1.Code)
	}

	// Second request should be rate limited
	req2 := httptest.NewRequest("GET", "/test", nil)
	req2.RemoteAddr = "10.0.0.1:12345"
	w2 := httptest.NewRecorder()
	handler.ServeHTTP(w2, req2)

	if w2.Code != http.StatusTooManyRequests {
		t.Errorf("Second request: expected 429, got %d", w2.Code)
	}
}

func TestGetClientIP(t *testing.T) {
	testCases := []struct {
		name       string
		headers    map[string]string
		remoteAddr string
		expected   string
	}{
		{
			name:       "X-Forwarded-For",
			headers:    map[string]string{"X-Forwarded-For": "203.0.113.1"},
			remoteAddr: "192.168.1.1:12345",
			expected:   "203.0.113.1",
		},
		{
			name:       "X-Real-IP",
			headers:    map[string]string{"X-Real-IP": "203.0.113.2"},
			remoteAddr: "192.168.1.1:12345",
			expected:   "203.0.113.2",
		},
		{
			name:       "Remote addr fallback",
			headers:    map[string]string{},
			remoteAddr: "192.168.1.1:12345",
			expected:   "192.168.1.1:12345",
		},
		{
			name: "X-Forwarded-For takes precedence",
			headers: map[string]string{
				"X-Forwarded-For": "203.0.113.1",
				"X-Real-IP":       "203.0.113.2",
			},
			remoteAddr: "192.168.1.1:12345",
			expected:   "203.0.113.1",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/test", nil)
			req.RemoteAddr = tc.remoteAddr
			for k, v := range tc.headers {
				req.Header.Set(k, v)
			}

			ip := getClientIP(req)
			if ip != tc.expected {
				t.Errorf("Expected IP %s, got %s", tc.expected, ip)
			}
		})
	}
}

func TestPreConfiguredLimiters(t *testing.T) {
	// Test that pre-configured limiters exist and have correct rates
	if AuthLimiter == nil {
		t.Error("AuthLimiter should be initialized")
	}
	if PaymentLimiter == nil {
		t.Error("PaymentLimiter should be initialized")
	}
	if APILimiter == nil {
		t.Error("APILimiter should be initialized")
	}

	// Test AuthLimiter rate (10 req/min)
	for i := 0; i < 10; i++ {
		if !AuthLimiter.Allow("test-auth-ip") {
			t.Errorf("AuthLimiter: request %d should be allowed", i+1)
		}
	}
	if AuthLimiter.Allow("test-auth-ip") {
		t.Error("AuthLimiter: 11th request should be blocked")
	}
}

func BenchmarkRateLimiterAllow(b *testing.B) {
	rl := NewRateLimiter(1000000, time.Minute)
	ip := "benchmark-ip"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rl.Allow(ip)
	}
}
