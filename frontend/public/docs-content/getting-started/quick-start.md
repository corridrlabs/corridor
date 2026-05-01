# Quick Start Guide

Get up and running with Corridor in just 5 minutes!

## Step 1: Create an Account

1. Visit [corridormoney.net/signup](https://corridormoney.net/signup)
2. Enter your email and create a password
3. Verify your email address

## Step 2: Set Up Your Organization

```bash
# Or use our CLI
npx create-corridor-org
```

1. Enter your organization name
2. Choose your industry
3. Select your team size

## Step 3: Get Your API Keys

Navigate to **Settings → API Keys** and create your first API key:

```javascript
const corridor = require('@corridor/sdk');

const client = new corridor.Client({
  apiKey: 'your_api_key_here'
});
```

## Step 4: Make Your First API Call

```javascript
// Create an invoice
const invoice = await client.invoices.create({
  customer_id: 'cust_123',
  amount: 10000,
  currency: 'KES',
  description: 'Consulting services'
});

console.log('Invoice created:', invoice.id);
```

## Step 5: Set Up Webhooks

Configure webhooks to receive real-time updates:

```javascript
// Listen for payment events
app.post('/webhooks/corridor', (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment.succeeded') {
    console.log('Payment received!', event.data);
  }
  
  res.sendStatus(200);
});
```

## Next Steps

- [Authentication Guide](/docs/api-reference/authentication)
- [Payment Flows](/docs/guides/payment-flows)
- [Webhook Setup](/docs/api-reference/webhooks)

## Need Help?

Join our [Discord community](https://discord.gg/corridor) or email people@corridormoney.net
