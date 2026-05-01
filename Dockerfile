# Build stage
FROM golang:1.24-bookworm AS builder

# Set GOPRIVATE to ensure Go doesn't try to use public proxies for your private code
ENV GOPRIVATE=github.com/corridrlabs/*

WORKDIR /app

# Install build dependencies (Debian-based image)
RUN apt-get update && apt-get install -y --no-install-recommends gcc musl-dev && rm -rf /var/lib/apt/lists/*

# Copy go mod and sum files
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy source code
COPY backend/ .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o corridor-api ./cmd/api

# Run stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/corridor-api .
# Copy schema and migrations for reference/init
COPY --from=builder /app/*.sql ./

# Expose port
EXPOSE 8080

# Set environment variables
ENV APP_ENV=production

# Run the application
CMD ["./corridor-api"]