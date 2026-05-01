# Build Stage
FROM golang:1.24-bookworm AS builder

WORKDIR /app

# Install build dependencies (Debian-based)
RUN apt-get update && apt-get install -y --no-install-recommends gcc musl-dev && rm -rf /var/lib/apt/lists/*

# Copy generic config
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o corridor-api ./cmd/api

# Run Stage
FROM debian:bookworm-slim

WORKDIR /app

# Install certificates for HTTPS (blockchain calls)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/corridor-api .

# Expose port (default 8080, overridden by PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Environment variables should be set in Render
CMD ["./corridor-api"]
