# Developer Integration Guide

This guide covers the full developer model: create a normal Corridor account, generate API keys, and run payment infrastructure from your backend against that account.

## 1. Integration model

1. Create a Corridor personal or business account.
2. Log in once with Bearer token.
3. Accept the legal consent gates if prompted.
4. Create API key(s).
5. Call Corridor APIs from your backend with `X-API-Key`.
6. Handle webhooks and retries in your system.

All API activity is scoped to the owning Corridor account.

## 2. Authentication and key lifecycle

### 2.1 Login and get Bearer token

```bash
curl -X POST "https://payday-kqgb.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YOUR_PASSWORD"}'
```

### 2.2 Create API key

```bash
curl -X POST "https://payday-kqgb.onrender.com/api/api-keys" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Production Key","is_live":true}'
```

### 2.3 Use API key

```bash
curl -X GET "https://payday-kqgb.onrender.com/api/wallets" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 2.4 Revoke API key

```bash
curl -X POST "https://payday-kqgb.onrender.com/api/api-keys/revoke?id=KEY_UUID" \
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

## 5. Plan gating and billing controls

Corridor enforces paid-feature access for both Bearer-auth and API-key-auth calls.

## 6. MCP server for full API usage

Corridor ships an MCP server exposing these APIs as tools.

### Local stdio mode

```bash
cd mcp
PAYDAY_API_URL=https://payday-kqgb.onrender.com \
PAYDAY_API_KEY=pk_your_corridor_api_key \
go run ./cmd
```

### Remote HTTP mode

```bash
cd mcp
PAYDAY_API_URL=https://payday-kqgb.onrender.com \
PAYDAY_API_KEY=pk_your_corridor_api_key \
go run ./cmd/http
```

Remote JSON-RPC endpoint:

- `POST /mcp/messages`
- `GET /health`

See: `mcp/README.md`
