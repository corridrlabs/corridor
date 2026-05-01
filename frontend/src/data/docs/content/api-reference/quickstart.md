# Quickstart

Get from account signup to production-ready server integration quickly.

## 1. Create a Corridor Account

1. Sign up as a personal or business account at [corridormoney.net](https://corridormoney.net)
2. Complete initial profile/KYC details needed for your payment use case
3. Use this account as the owner of wallets, payouts, links, goals, invoices, and webhooks

## 2. Login Once (Bearer Token)

```bash
curl -X POST "https://api.corridormoney.net/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "YOUR_PASSWORD"
  }'
```

Save the returned `access_token` as `YOUR_ACCESS_TOKEN`.

## 3. Create API Key (for Server-to-Server Calls)

```bash
curl -X POST "https://api.corridormoney.net/api/api-keys" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "is_live": true
  }'
```

Save the returned `key` as `YOUR_API_KEY`.

## 4. Call Corridor from Your Backend with `X-API-Key`

### Example: List Wallets

```bash
curl -X GET "https://api.corridormoney.net/api/wallets" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Example: Create Payment Link

```bash
curl -X POST "https://api.corridormoney.net/api/payment-links" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Starter Plan",
    "amount": 49.99,
    "currency": "USD"
  }'
```

### Example: Request Payout

```bash
curl -X POST "https://api.corridormoney.net/api/payouts" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 120,
    "currency": "USD",
    "destination_bank": "MyBank",
    "account_number": "1234567890",
    "account_name": "Acme Inc"
  }'
```

## 5. Register Webhooks

```bash
curl -X POST "https://api.corridormoney.net/api/webhooks" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/corridor/webhooks",
    "events": ["payment.success", "payment.failed", "invoice.paid"]
  }'
```

## 6. Production Checklist

- Keep API keys only on your backend (never in browser/mobile client code)
- Verify webhook signatures before processing events
- Send `X-Idempotency-Key` on write requests (`/api/fund-wallet`, `/api/payouts`, `/api/payment-links`, `/api/onramp/circle`)
- Handle retries and idempotency in your own system
- Return user-friendly errors to customers (hide backend internals)
- Monitor payout and funding failures and provide recovery actions
- Handle `402 Payment Required` by prompting account upgrade for plan-gated features

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Auth endpoints | 10/minute |
| Payment endpoints | 100/minute |
| Partner API (with key) | 1000/minute |

## Next Steps

- [Authentication Guide](/docs/authentication) - Auth flows and key rotation
- [Developer Integration Guide](/docs/api/developer-integration-guide) - End-to-end build plan
- [Social Goals API](/docs/api/social-goals) - Goal lifecycle and contributions
- [Webhooks](/docs/webhooks) - Event delivery and signature verification