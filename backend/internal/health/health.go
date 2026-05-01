package health

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-redis/redis/v8"
)

type HealthChecker struct {
	db    *sql.DB
	redis *redis.Client
}

type HealthStatus struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Services  map[string]Status `json:"services"`
}

type Status struct {
	Status      string        `json:"status"`
	ResponseTime time.Duration `json:"response_time_ms"`
	Message     string        `json:"message,omitempty"`
	Error       string        `json:"error,omitempty"`
}

func NewHealthChecker(db *sql.DB, redis *redis.Client) *HealthChecker {
	return &HealthChecker{
		db:    db,
		redis: redis,
	}
}

func (h *HealthChecker) HealthHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	status := h.checkHealth(ctx)
	
	w.Header().Set("Content-Type", "application/json")
	if status.Status == "healthy" {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	
	json.NewEncoder(w).Encode(status)
}

func (h *HealthChecker) ReadinessHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	ready := h.checkReadiness(ctx)
	
	w.Header().Set("Content-Type", "application/json")
	if ready {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"status": "not ready"})
	}
}

func (h *HealthChecker) checkHealth(ctx context.Context) HealthStatus {
	services := make(map[string]Status)
	overallStatus := "healthy"

	// Check database
	dbStatus := h.checkDatabase(ctx)
	services["database"] = dbStatus
	if dbStatus.Status != "healthy" {
		overallStatus = "unhealthy"
	}

	// Check Redis (optional)
	if h.redis != nil {
		redisStatus := h.checkRedis(ctx)
		services["redis"] = redisStatus
	} else {
		services["redis"] = Status{Status: "disabled", Message: "Redis not configured"}
	}

	return HealthStatus{
		Status:    overallStatus,
		Timestamp: time.Now(),
		Services:  services,
	}
}

func (h *HealthChecker) checkReadiness(ctx context.Context) bool {
	// Check if database is accessible
	if err := h.db.PingContext(ctx); err != nil {
		return false
	}

	// Check if Redis is accessible (optional)
	if h.redis != nil {
		if err := h.redis.Ping(ctx).Err(); err != nil {
			return false
		}
	}

	return true
}

func (h *HealthChecker) checkDatabase(ctx context.Context) Status {
	start := time.Now()
	
	err := h.db.PingContext(ctx)
	responseTime := time.Since(start)
	
	if err != nil {
		return Status{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        err.Error(),
		}
	}

	// Check if we can execute a simple query
	var count int
	err = h.db.QueryRowContext(ctx, "SELECT 1").Scan(&count)
	if err != nil {
		return Status{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        "query failed: " + err.Error(),
		}
	}

	return Status{
		Status:       "healthy",
		ResponseTime: responseTime,
	}
}

func (h *HealthChecker) checkRedis(ctx context.Context) Status {
	start := time.Now()
	
	err := h.redis.Ping(ctx).Err()
	responseTime := time.Since(start)
	
	if err != nil {
		return Status{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        err.Error(),
		}
	}

	// Test set/get operation
	testKey := "health_check_" + time.Now().Format("20060102150405")
	err = h.redis.Set(ctx, testKey, "test", time.Minute).Err()
	if err != nil {
		return Status{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        "set operation failed: " + err.Error(),
		}
	}

	// Clean up test key
	h.redis.Del(ctx, testKey)

	return Status{
		Status:       "healthy",
		ResponseTime: responseTime,
	}
}
