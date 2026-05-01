# Payment Flows Guide

Learn how to implement payment flows in your application using Corridor.

## Overview

Corridor supports multiple payment flows:

1. **Direct Payments** - One-time payments
2. **Subscription Payments** - Recurring billing
3. **Invoice Payments** - Send invoices to customers
4. **Split Payments** - Distribute payments to multiple recipients

## Direct Payments

### Step 1: Create a Payment Intent

```javascript
const paymentIntent = await client.payments.createIntent({
  amount: 5000,
  currency: 'KES',
  customer_id: 'cust_123',
  description: 'Product purchase',
  metadata: {
    order_id: 'order_456'
  }
});
```

### Step 2: Collect Payment Details

```javascript
// Client-side code
const result = await corridor.confirmPayment({
  clientSecret: paymentIntent.client_secret,
  payment_method: {
    type: 'mpesa',
    phone_number: '+254712345678'
  }
});

if (result.status === 'succeeded') {
  console.log('Payment successful!');
}
```

### Step 3: Handle Webhooks

```javascript
app.post('/webhooks/corridor', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'payment.succeeded':
      // Fulfill order
      fulfillOrder(event.data.metadata.order_id);
      break;
    case 'payment.failed':
      // Notify customer
      notifyPaymentFailure(event.data.customer_id);
      break;
  }
  
  res.sendStatus(200);
});
```

## Subscription Payments

### Create a Subscription

```javascript
const subscription = await client.subscriptions.create({
  customer_id: 'cust_123',
  plan_id: 'plan_pro',
  payment_method: 'pm_card_visa',
  trial_days: 14
});
```

### Handle Subscription Events

```javascript
// Listen for subscription events
app.post('/webhooks/corridor', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'subscription.created':
      grantAccess(event.data.customer_id);
      break;
    case 'subscription.canceled':
      revokeAccess(event.data.customer_id);
      break;
    case 'subscription.payment_failed':
      sendPaymentReminder(event.data.customer_id);
      break;
  }
  
  res.sendStatus(200);
});
```

## Invoice Payments

### Create and Send Invoice

```javascript
const invoice = await client.invoices.create({
  customer_id: 'cust_123',
  line_items: [
    {
      description: 'Consulting services',
      amount: 50000,
      quantity: 1
    },
    {
      description: 'Development work',
      amount: 100000,
      quantity: 2
    }
  ],
  due_date: '2024-12-31',
  send_email: true
});
```

### Track Invoice Status

```javascript
const invoice = await client.invoices.retrieve('inv_123');

console.log('Status:', invoice.status);
// Status can be: draft, sent, paid, overdue, canceled
```

## Best Practices

### 1. Idempotency

Always use idempotency keys for payment requests:

```javascript
const payment = await client.payments.create({
  amount: 10000,
  currency: 'KES',
  idempotency_key: 'unique_key_123'
});
```

### 2. Error Handling

```javascript
try {
  const payment = await client.payments.create(data);
} catch (error) {
  if (error.type === 'card_error') {
    // Card was declined
    showError('Payment failed. Please try another card.');
  } else if (error.type === 'rate_limit_error') {
    // Too many requests
    showError('Too many attempts. Please try again later.');
  } else {
    // Other errors
    showError('An error occurred. Please try again.');
  }
}
```

### 3. Webhook Security

Verify webhook signatures:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/corridor', (req, res) => {
  const signature = req.headers['corridor-signature'];
  
  if (!verifyWebhook(req.rawBody, signature, process.env.WEBHOOK_SECRET)) {
    return res.sendStatus(401);
  }
  
  // Process webhook
  res.sendStatus(200);
});
```

## Testing

Use test mode for development:

```javascript
const client = new corridor.Client({
  apiKey: process.env.CORRIDOR_TEST_KEY,
  testMode: true
});

// Use test card numbers
const payment = await client.payments.create({
  amount: 1000,
  payment_method: {
    type: 'card',
    number: '4242424242424242', // Test card
    exp_month: 12,
    exp_year: 2025,
    cvc: '123'
  }
});
```

## Next Steps

- [Webhooks Reference](/docs/api-reference/webhooks)
- [Payment API Reference](/docs/api-reference/payments)
- [Error Handling Guide](/docs/guides/error-handling)
