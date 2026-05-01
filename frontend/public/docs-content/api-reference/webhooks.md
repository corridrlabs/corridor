# Webhooks

Webhooks allow you to receive real-time notifications when events occur in your Corridor account.

## Setting Up Webhooks

You can manage webhooks via API or Dashboard.
Webhook endpoints are available on paid plans; free-tier access returns `402 Payment Required`.

### Create a Webhook

```bash
curl -X POST "https://api.corridormoney.net/api/webhooks" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/corridor/webhooks",
    "events": ["payment.success", "payment.failed", "invoice.paid"]
  }'
```

### List Webhooks

```bash
curl -X GET "https://api.corridormoney.net/api/webhooks" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Delete Webhook

```bash
curl -X POST "https://api.corridormoney.net/api/webhooks/delete?id=WEBHOOK_UUID" \
  -H "X-API-Key: YOUR_API_KEY"
```

## Event Types

### Payment Events

| Event | Description |
|-------|-------------|
| `payment.success` | Payment completed successfully |
| `payment.failed` | Payment failed |

### Goal Events

| Event | Description |
|-------|-------------|
| `goal.created` | New goal created |
| `goal.contribution` | Contribution received |
| `goal.completed` | Goal reached target |
| `goal.ejected` | Funds withdrawn from goal |

### Wallet Events

| Event | Description |
|-------|-------------|
| `wallet.funded` | Wallet received funds |
| `wallet.created` | New wallet created |

### Invoice Events

| Event | Description |
|-------|-------------|
| `invoice.created` | Invoice created |
| `invoice.paid` | Invoice was paid |
| `invoice.overdue` | Invoice past due date |

## Webhook Payload Format

All webhooks are sent as HTTP POST requests with JSON body:

```json
{
  "id": "evt_550e8400e29b41d4a716446655440000",
  "type": "goal.contribution",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "goal_id": "550e8400-e29b-41d4-a716-446655440000",
    "contribution_id": "contrib-uuid",
    "amount": 25.00,
    "currency": "USDC",
    "contributor_name": "Alice",
    "goal_current_amount": 75.00,
    "goal_target_amount": 100.00
  }
}
```

## Webhook Headers

Each webhook request includes these headers:

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `X-Corridor-Signature` | HMAC SHA-256 signature for verification |
| `X-Corridor-Event` | Event type |
| `X-Corridor-Delivery` | Unique delivery ID |

## Verifying Webhooks

Verify webhook authenticity using the signature:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expected;
}
```

## Responding to Webhooks

Your endpoint should:

1. Return `200 OK` quickly (within 5 seconds)
2. Process the event asynchronously if needed
3. Be idempotent (handle duplicate deliveries)

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhooks/corridor', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Corridor-Signature')
    if not verify_webhook(request.data.decode(), signature, WEBHOOK_SECRET):
        return 'Invalid signature', 401
    
    event = request.json
    process_event.delay(event)
    
    return 'OK', 200
```

## Retry Policy

Failed webhook deliveries are retried:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 24 hours |

After 6 failed attempts, the webhook is marked as failed.

## Security Best Practices

1. **Always verify signatures** - Don't process unverified webhooks
2. **Use HTTPS** - Webhook endpoints must use HTTPS
3. **Idempotency** - Handle duplicate events gracefully
4. **Timeout handling** - Return quickly, process async
5. **Secret rotation** - Rotate webhook secrets periodically