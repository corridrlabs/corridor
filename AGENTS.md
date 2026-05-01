# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build & Run Commands

### Full Development Environment (Docker)
```bash
make dev                    # Start all services with docker-compose
docker-compose up --build   # Same as above
```

### Individual Services (Local Development)
```bash
# Backend (Go)
cd backend && go run ./cmd/api   # Run API server locally
cd backend && go build ./cmd/api # Build binary

# Frontend (React/Vite)
cd frontend && npm install       # Install dependencies
cd frontend && npm run dev       # Dev server on :3000
cd frontend && npm run build     # Production build (runs tsc --noEmit first)
cd frontend && npm run lint      # ESLint check
```

### Database
```bash
make migrate          # Run Alembic migrations via Docker
make makemigration    # Create new migration (prompts for message)
make seed             # Seed with demo data (not yet implemented)
```

### Testing
```bash
make test                        # Run tests via Docker (pytest)
cd backend && go test ./...      # Go tests directly
cd frontend && npm test          # Jest tests (if configured)
```

### Cleanup
```bash
make clean   # docker-compose down -v && docker system prune -f
```

## Architecture Overview

### Service Topology
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Frontend    │───▶│  API Gateway │───▶│   Backend    │
│  React/Vite  │    │    Nginx     │    │   Go HTTP    │
│  :3000       │    │    :8080     │    │   :8000      │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
               ┌────▼────┐              ┌──────▼──────┐            ┌──────▼──────┐
               │PostgreSQL│              │    Redis    │            │   Solana    │
               │  :5432   │              │    :6379    │            │   (chain)   │
               └──────────┘              └─────────────┘            └─────────────┘
```

### Backend Structure (Go)
```
backend/
├── cmd/api/           # Entry point + HTTP handlers
│   └── main.go        # Routes, middleware, server setup
├── internal/
│   ├── core/          # Business logic (domain services)
│   │   ├── service.go # Main service aggregator
│   │   ├── auth.go, account.go, ewa.go, social.go, etc.
│   ├── adapters/db/   # PostgreSQL adapter
│   ├── circle/        # Circle API client (USDC)
│   ├── solana/        # Solana client + deposit monitor
│   └── email/         # AWS SES email service
└── pkg/config/        # Environment config loading
```

Key pattern: The `core.Service` struct aggregates all business logic and is injected into handlers. Handlers in `cmd/api/*.go` call service methods.

### Frontend Structure (React/TypeScript)
```
frontend/src/
├── api/          # API client functions
├── components/   # Reusable UI components
├── pages/        # Route-level page components
├── contexts/     # React context providers
├── hooks/        # Custom React hooks
├── store/        # Zustand state management
├── services/     # Service layer (wallet, payment flows)
└── sdk/          # SDK integrations (Circle, Solana)
```

State: Uses Zustand for global state, React Query for server state.

### Smart Contracts (Solana/Anchor)
```
contracts/corridor_solana_contracts/
└── programs/
    ├── ewa_program/       # Earned Wage Access on-chain logic
    └── payroll_escrow/    # Payroll escrow contract
```

Built with Anchor framework (Rust). Deploy targets Solana devnet for development.

## Database Schema

Multi-schema PostgreSQL architecture:
- `public` - Core tables
- `identity` - Auth/user management
- `payments` - Transaction processing
- `ewa` - Earned Wage Access
- `social_payments` - Social payment features

Ledger uses double-entry accounting pattern.

## Key Environment Variables

Backend requires these (see `.env.example`):
- `PAYDAY_DATABASE_URL` - PostgreSQL connection string
- `PAYDAY_CIRCLE_API_KEY` - Circle sandbox/production API key
- `PAYDAY_SOLANA_RPC_URL` - Solana RPC endpoint
- `PAYDAY_SOLANA_MASTER_WALLET` - Company treasury wallet pubkey
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing key

## External Integrations

- **Circle** - USDC on/off-ramp and card deposits
- **Solana** - Native crypto payments, EWA contracts
- **Stripe** - Traditional card processing
- **AWS SES** - Transactional email
- **M-Pesa** - Mobile money (emerging markets)

## Code Conventions

- Backend handlers are in `backend/cmd/api/handlers*.go`
- Use `handleMethod()` helper for routes that support both GET and POST
- Frontend uses Tailwind CSS with component-level styling
- API responses use consistent JSON structure with `error` or `data` fields
- Passwords are hashed with bcrypt (cost 12) - see `core.HashPassword()`
- Auth endpoints are rate-limited (10 req/min), payments (100 req/min)

## Partner API & MCP Integration

### API Documentation
- OpenAPI spec: `docs/api/openapi.yaml`
- Quickstart: `docs/api/quickstart.md`
- Auth guide: `docs/api/authentication.md`
- Social Goals: `docs/api/social-goals.md`
- Webhooks: `docs/api/webhooks.md`

### MCP Server (for AI Agents)
```bash
# Build and run MCP server
cd mcp && go build -o corridor-mcp ./cmd
PAYDAY_API_KEY=your_key PAYDAY_API_URL=http://localhost:8000 ./corridor-mcp
```

Available MCP tools:
- `create_goal` - Create crowdfunding goal
- `contribute_to_goal` - Contribute to a goal
- `check_balance` - Check wallet balance
- `send_payment` - Send P2P payment
- `create_invoice` - Create invoice

### API Key Authentication
Partners authenticate via `X-API-Key` header. Create keys at `/api/api-keys`.

## Running Tests

```bash
# Run all Go tests
cd backend && go test ./...

# Run specific package tests
cd backend && go test ./internal/core/...
cd backend && go test ./internal/middleware/...
```
