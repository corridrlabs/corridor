package middleware

import (
	"net/http"
	"sync"
	"time"
)

// RateLimiter implements a simple token bucket rate limiter
type RateLimiter struct {
	requests map[string]*clientBucket
	mu       sync.RWMutex
	rate     int           // requests per window
	window   time.Duration // time window
}

type clientBucket struct {
	tokens     int
	lastRefill time.Time
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string]*clientBucket),
		rate:     rate,
		window:   window,
	}
	// Cleanup old entries periodically
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, bucket := range rl.requests {
			if now.Sub(bucket.lastRefill) > rl.window*2 {
				delete(rl.requests, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// Allow checks if a request from the given IP is allowed
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	bucket, exists := rl.requests[ip]

	if !exists {
		rl.requests[ip] = &clientBucket{
			tokens:     rl.rate - 1,
			lastRefill: now,
		}
		return true
	}

	// Refill tokens if window has passed
	if now.Sub(bucket.lastRefill) >= rl.window {
		bucket.tokens = rl.rate
		bucket.lastRefill = now
	}

	if bucket.tokens > 0 {
		bucket.tokens--
		return true
	}

	return false
}

// Middleware returns an HTTP middleware that applies rate limiting
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		if !rl.Allow(ip) {
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error": "rate limit exceeded", "retry_after": 60}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RateLimitHandler wraps a handler function with rate limiting
func (rl *RateLimiter) RateLimitHandler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		if !rl.Allow(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error": "rate limit exceeded", "retry_after": 60}`, http.StatusTooManyRequests)
			return
		}

		handler(w, r)
	}
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (for proxies)
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		return xff
	}

	// Check X-Real-IP header
	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	return r.RemoteAddr
}

// Pre-configured rate limiters for different endpoint types
var (
	// AuthLimiter: 10 requests per minute for auth endpoints
	AuthLimiter = NewRateLimiter(10, time.Minute)

	// PaymentLimiter: 100 requests per minute for payment endpoints
	PaymentLimiter = NewRateLimiter(100, time.Minute)

	// APILimiter: 1000 requests per minute for general API (for partners with API keys)
	APILimiter = NewRateLimiter(1000, time.Minute)
)
