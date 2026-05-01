# Corridor Platform Status

This document is a factual implementation status check against the current repository state.

It is not a roadmap and not a marketing overview. Anything listed as partial or pending should be treated as work still in progress.

## Implemented

### Payment rails
- Helius-backed Solana monitoring exists with websocket subscriptions and a reconciliation fallback in [backend/internal/helius/websocket.go](/home/adulam/dev/Payday/backend/internal/helius/websocket.go) and [backend/internal/solana/monitor.go](/home/adulam/dev/Payday/backend/internal/solana/monitor.go).
- Circle USDC deposit flows and webhook verification are implemented in [backend/cmd/api/handlers_deposits.go](/home/adulam/dev/Payday/backend/cmd/api/handlers_deposits.go).
- Fiat-to-USDC conversion exists as a service layer capability in [backend/internal/core/account.go](/home/adulam/dev/Payday/backend/internal/core/account.go), with live rates and fallback rates.

### Billing and plans
- A native subscription activation path exists in [backend/internal/core/billing.go](/home/adulam/dev/Payday/backend/internal/core/billing.go).
- `HasFeatureAccess` exists and is used for plan gating in [backend/internal/core/billing.go](/home/adulam/dev/Payday/backend/internal/core/billing.go).
- The frontend billing UI still supports hosted checkout flows through [frontend/src/services/billing.ts](/home/adulam/dev/Payday/frontend/src/services/billing.ts) and [backend/cmd/api/handlers_billing.go](/home/adulam/dev/Payday/backend/cmd/api/handlers_billing.go).

### Revenue handling
- Revenue distribution at a 70/20/10 split is implemented in [backend/internal/core/revenue.go](/home/adulam/dev/Payday/backend/internal/core/revenue.go).
- Withdrawal vouchers exist in [backend/internal/core/vouchers.go](/home/adulam/dev/Payday/backend/internal/core/vouchers.go).

### Branding and ledger messaging
- Branded transaction messages are implemented through `BrandedMessage` in [backend/internal/core/service.go](/home/adulam/dev/Payday/backend/internal/core/service.go).
- Financial events use branded messages in several flows, including billing, payouts, and vouchers.

### Social graph
- Social feed activity is account-scoped and graph-aware in [backend/internal/core/social.go](/home/adulam/dev/Payday/backend/internal/core/social.go).
- Follow and unfollow controls exist in [backend/cmd/api/handlers.go](/home/adulam/dev/Payday/backend/cmd/api/handlers.go) and the Team/Network UI.

## Partially implemented

### Native billing replacement
- The codebase has a corridor-internal subscription activation path, but hosted billing integration is still present.
- The current state is mixed, not fully provider-free.
- A true recurring renewal worker is not visible in the repository.

### Fiat bridge coverage
- Live FX refresh supports KES, NGN, GHS, and SOL, with KWD refresh logic present when upstream rates exist in [backend/internal/core/account.go](/home/adulam/dev/Payday/backend/internal/core/account.go).
- KWD is not backed by a dedicated rail or payout flow in the codebase.

### Helius monitoring
- Helius websocket monitoring is real, but there is still a reconciliation ticker in [backend/internal/solana/monitor.go](/home/adulam/dev/Payday/backend/internal/solana/monitor.go).
- This is hybrid event-driven + fallback polling, not pure websocket-only operation.

### Treasury sweeps
- Treasury configuration and sweep recording exist in [backend/internal/core/treasury.go](/home/adulam/dev/Payday/backend/internal/core/treasury.go).
- The code records sweep intent and internal transfers, but there is no visible external bank payout executor in the repository.

### Vouchers and cash-out
- Voucher issuance and redemption exist in [backend/internal/core/vouchers.go](/home/adulam/dev/Payday/backend/internal/core/vouchers.go).
- The end-to-end agent or physical cash-out workflow is not fully visible in code.

## Pending

- Remove all hosted billing dependencies and replace them with a single native Corridor billing provider.
- Add a renewal scheduler or worker for recurring subscription debits and dunning.
- Build a real bank payout executor for revenue sweeps.
- Add a proof-of-reserves or reserve reporting surface if that is intended as part of the product promise.
- Expand fiat rail support beyond the currencies and fallback paths currently present.

## Notes

- The presence of `PASS` in build/test output does not mean these product claims are fully implemented.
- Several docs in `docs/` and `frontend/src/data/docs/` are aspirational or marketing-oriented; this file is the better source of truth for current delivery status.
