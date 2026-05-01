package health

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// HTTP metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	// Database metrics
	dbConnectionsActive = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "db_connections_active",
			Help: "Number of active database connections",
		},
	)

	dbConnectionsIdle = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "db_connections_idle",
			Help: "Number of idle database connections",
		},
	)

	dbQueryDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "db_query_duration_seconds",
			Help:    "Database query duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"query_type"},
	)

	// Business metrics
	userRegistrationsTotal = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "user_registrations_total",
			Help: "Total number of user registrations",
		},
	)

	paymentsProcessedTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "payments_processed_total",
			Help: "Total number of payments processed",
		},
		[]string{"status", "method"},
	)

	paymentsFailedTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "payments_failed_total",
			Help: "Total number of failed payments",
		},
		[]string{"reason", "method"},
	)

	// System metrics
	memoryUsageBytes = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "memory_usage_bytes",
			Help: "Current memory usage in bytes",
		},
	)

	goroutinesActive = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "goroutines_active",
			Help: "Number of active goroutines",
		},
	)
)

func init() {
	// Register metrics with Prometheus
	prometheus.MustRegister(
		httpRequestsTotal,
		httpRequestDuration,
		dbConnectionsActive,
		dbConnectionsIdle,
		dbQueryDuration,
		userRegistrationsTotal,
		paymentsProcessedTotal,
		paymentsFailedTotal,
		memoryUsageBytes,
		goroutinesActive,
	)
}

// MetricsHandler returns the Prometheus metrics handler
func MetricsHandler() http.Handler {
	return promhttp.Handler()
}

// HTTPMetricsMiddleware wraps HTTP handlers to collect metrics
func HTTPMetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Wrap ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		next.ServeHTTP(wrapped, r)
		
		duration := time.Since(start)
		
		// Record metrics
		httpRequestsTotal.WithLabelValues(
			r.Method,
			r.URL.Path,
			strconv.Itoa(wrapped.statusCode),
		).Inc()
		
		httpRequestDuration.WithLabelValues(
			r.Method,
			r.URL.Path,
		).Observe(duration.Seconds())
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Business metric helpers
func RecordUserRegistration() {
	userRegistrationsTotal.Inc()
}

func RecordPaymentProcessed(status, method string) {
	paymentsProcessedTotal.WithLabelValues(status, method).Inc()
}

func RecordPaymentFailed(reason, method string) {
	paymentsFailedTotal.WithLabelValues(reason, method).Inc()
}

func RecordDBQueryDuration(queryType string, duration time.Duration) {
	dbQueryDuration.WithLabelValues(queryType).Observe(duration.Seconds())
}

func UpdateDBConnections(active, idle int) {
	dbConnectionsActive.Set(float64(active))
	dbConnectionsIdle.Set(float64(idle))
}

func UpdateSystemMetrics(memoryBytes int64, goroutines int) {
	memoryUsageBytes.Set(float64(memoryBytes))
	goroutinesActive.Set(float64(goroutines))
}