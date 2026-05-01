# Developer Integration Guide

This guide covers the full developer model: create a normal Corridor account, generate API keys, and run payment infrastructure from your backend against that account.

## 1. Integration model

1. Create a Corridor personal or business account.
2. Log in once with Bearer token.
3. Create API key(s).
4. Call Corridor APIs from your backend with `X-API-Key`.
5. Handle webhooks and retries in your system.

All API activity is scoped to the owning Corridor account.

## 2. Authentication and key lifecycle

### 2.1 Login and get Bearer token

```bash
curl -X POST "https://api.corridormoney.net/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YOUR_PASSWORD"}'
```

### 2.2 Create API key

```bash
curl -X POST "https://api.corridormoney.net/api/api-keys" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Production Key","is_live":true}'
```

### 2.3 Use API key

```bash
curl -X GET "https://api.corridormoney.net/api/wallets" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 2.4 Revoke API key

```bash
curl -X POST "https://api.corridormoney.net/api/api-keys/revoke?id=KEY_UUID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 3. Core API capability map

### 3.1 Account and wallet
- `GET /api/accounts/settings`
- `POST /api/accounts/settings`
- `GET /api/wallets`
- `POST /api/wallets`
- `GET /api/account/liquidity`
- `GET /api/notifications`

### 3.2 Funding (add money)
- `GET /api/funding-sources`
- `POST /api/funding-sources`
- `POST /api/fund-wallet`
- `POST /api/onramp/circle`
- `GET /api/onramp/solana`

### 3.3 Payouts (withdrawals)
- `GET /api/payouts`
- `POST /api/payouts`

### 3.4 Commerce
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/invoices`
- `POST /api/invoices`
- `GET /api/invoices/detail?id=...`
- `POST /api/invoices/pay?id=...`
- `POST /api/invoices/send?id=...`
- `POST /api/invoices/remind?id=...`
- `GET /api/payment-links`
- `POST /api/payment-links`

### 3.5 Social and transfer flows
- `GET /api/social/goals`
- `POST /api/social/goals`
- `GET /api/social/goals/{goal_id}`
- `GET /api/social/goals/{goal_id}/contributions`
- `POST /api/social/goals/contribute`
- `POST /api/social/goals/eject`
- `POST /api/social/pay`
- `GET /api/social/feed`
- `GET /api/social/exchange-rate?from=USD&to=KES`

### 3.6 Webhooks and developer ops
- `GET /api/webhooks`
- `POST /api/webhooks`
- `POST /api/webhooks/delete?id=...`
- `GET /api/api-keys`
- `POST /api/api-keys`
- `POST /api/api-keys/revoke?id=...`

## 4. Idempotency for safe retries

For mutating requests, send:

```http
X-Idempotency-Key: your-stable-unique-key
```

Implemented idempotent routes include:
- `POST /api/fund-wallet`
- `POST /api/payouts`
- `POST /api/payment-links`
- `POST /api/onramp/circle`

Behavior:
- same key + same payload = replay same result
- same key + different payload/path/account = `409`
- expired key = `409`

## 5. Plan gating and billing controls

Corridor enforces paid-feature access for both Bearer-auth and API-key-auth calls.

### 5.1 Plan-gated routes
- API keys (`/api/api-keys*`)
- Webhooks (`/api/webhooks*`)
- Payouts (`/api/payouts`)
- EWA (`/api/account/ewa/*`)
- Treasury sweep (`/api/treasury/sweep`)

Blocked access returns:
- `402 Payment Required`
- actionable upgrade message in response body

### 5.2 Transaction-fee monetization

Payout requests apply platform fees by account tier:
- Premium: `0.5%`
- Pro: `1.0%`
- Free/default: `1.5%`
- Minimum fee: `0.10`

Total wallet debit = `payout amount + fee`.

## 6. Error handling model (user-safe)

Map backend errors to actionable client messages:
- `401`: session invalid or missing credentials -> ask user to sign in again
- `402`: plan upgrade required -> show upgrade path
- `400`: request validation issue -> tell user which input to fix
- `404`: endpoint/resource missing -> suggest refresh/retry/check resource ID
- `409`: idempotency conflict -> retry with new idempotency key if payload changed
- `5xx`: temporary server issue -> retry with exponential backoff

Do not expose raw backend internals directly to end users.

## 7. Production checklist

- Keep API keys server-side only
- Separate sandbox/staging/production keys
- Verify webhook signatures
- Use idempotency keys for all write operations
- Add retries with backoff and circuit breaking
- Track request IDs and structured logs
- Alert on payout/funding/webhook failures

## 8. MCP server for full API usage

Corridor ships an MCP server exposing these APIs as tools:

```bash
cd mcp
go build -o corridor-mcp ./cmd
PAYDAY_API_KEY=YOUR_API_KEY PAYDAY_API_URL=https://api.corridormoney.net ./corridor-mcp
```

See: `mcp/README.md`

## 9. Additional references

- [Quickstart](./quickstart.md)
- [Authentication](./authentication.md)
- [Webhooks](./webhooks.md)
- [Social Goals](./social-goals.md)
- [OpenAPI](./openapi.yaml)
