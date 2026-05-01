# Payment Integration Template
**Type**: Template
**Duration**: 10 min read
**For**: Developers & Finance Teams

## Overview
A standardized template for integrating Corridor payments into your existing systems.

## Key Takeaways
- Standard API payload structure
- Error handling best practices
- Webhook configuration

## Implementation Steps

### 1. API Configuration
```javascript
const corridor = new Corridor({
  apiKey: process.env.CORRIDOR_API_KEY,
  environment: 'production'
});
```

### 2. Create Payment Intent
```javascript
const payment = await corridor.payments.create({
  amount: 1000,
  currency: 'KES',
  customer: 'cust_123',
  metadata: { order_id: 'ord_456' }
});
```

### 3. Handle Webhooks
Set up an endpoint to receive payment status updates:
- `payment.succeeded`
- `payment.failed`
- `payment.refunded`
