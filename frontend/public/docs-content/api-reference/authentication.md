# Authentication

Corridor supports two authentication methods:

## 1. API Key Authentication (Recommended for Partners)

Use API keys for server-to-server integrations and partner applications.

### Getting an API Key

```bash
# First, login to get a Bearer token
curl -X POST "https://api.corridormoney.net/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your_password"}'

# Then create an API key
curl -X POST "https://api.corridormoney.net/api/api-keys" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production API Key"}'
```

### Using Your API Key

Include the API key in the `X-API-Key` header:

```bash
curl -X GET "https://api.corridormoney.net/api/wallets" \
  -H "X-API-Key: pk_live_abc123..."
```

API keys can be used for account-scoped server routes such as wallets, funding, payouts, payment links, invoices, webhooks, and social goals.
Some routes are plan-gated and return `402 Payment Required` when the account tier does not include that feature.

### Key Prefixes

| Prefix | Environment |
|--------|-------------|
| `pk_live_` | Production |
| `pk_test_` | Sandbox |

### Security Best Practices

- Never expose API keys in client-side code
- Rotate keys periodically
- Use environment variables to store keys
- Revoke compromised keys immediately

### Revoking a Key

```bash
curl -X POST "https://api.corridormoney.net/api/api-keys/revoke?id=key-uuid-here" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 2. Bearer Token Authentication (For User Apps)

Use Bearer tokens for user-facing applications where users login.

### Register a New User

```bash
curl -X POST "https://api.corridormoney.net/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "secure_password_123",
    "type": "PERSONAL",
    "country": "KE"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Login

```bash
curl -X POST "https://api.corridormoney.net/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password_123"
  }'
```

### Using the Token

Include the token in the `Authorization` header:

```bash
curl -X GET "https://api.corridormoney.net/api/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Token Expiration

- Tokens expire after 24 hours
- Re-authenticate to get a new token
- Consider implementing token refresh in your app

## Email/Phone Verification

For enhanced security, verify user email or phone:

### Send Verification Code

```bash
curl -X POST "https://api.corridormoney.net/api/auth/verify/send" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "contact": "user@example.com"
  }'
```

### Confirm Code

```bash
curl -X POST "https://api.corridormoney.net/api/auth/verify/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "user@example.com",
    "code": "123456"
  }'
```

## Error Responses

### 401 Unauthorized

```json
{
  "error": "invalid credentials"
}
```

### 429 Rate Limited

```json
{
  "error": "rate limit exceeded",
  "retry_after": 60
}
```

### 402 Payment Required

```json
{
  "error": "plan upgrade required",
  "actionable_error": "API access is available on paid plans. Upgrade to PRO or PREMIUM."
}
```

## Choosing an Auth Method

| Use Case | Recommended Method |
|----------|-------------------|
| Backend service | API Key |
| Partner integration | API Key |
| Mobile app | Bearer Token |
| Web app (user login) | Bearer Token |
| MCP/AI Agent | API Key |