# Corridor Documentation

Welcome to the Corridor API documentation. Corridor is a modern payment infrastructure platform for building fintech applications with social payments, earned wage access, and crypto on/off-ramps.

## Build the Future of Payments

Everything you need to integrate Corridor payments into your application.

[Get Started](/docs/api-reference/quickstart) | [API Reference](/docs/api-reference/payments)

---

## Quick Links

| Feature | Description |
|---------|-------------|
| [Quickstart](/docs/api-reference/quickstart) | Get up and running in minutes |
| [Authentication](/docs/api-reference/authentication) | API keys and token flows |
| [Webhooks](/docs/api-reference/webhooks) | Event-driven integrations |
| [Social Goals](/docs/api-reference/social-goals) | Crowdfunding features |
| [Earned Wage Access](/docs/business/ewa/introduction) | On-demand pay |

## Why Corridor?

- **Multi-rail payments** - USDC, mobile money, bank transfers
- **Social features** - Goal-based crowdfunding with contributions
- **EWA Integration** - Real-time earned wage access
- **Developer-first** - Excellent DX with SDKs and webhooks

## Example: Create a Payment Link

```typescript
// Example: Create a payment link
const link = await corridor.paymentLinks.create({
  title: "Donation for cause",
  amount: 25.00,
  currency: "USD"
});
```

## Popular Guides

### For Developers
- [Quickstart Guide](/docs/api-reference/quickstart) - From signup to production
- [Authentication](/docs/api-reference/authentication) - Secure your API requests
- [Webhooks](/docs/api-reference/webhooks) - Real-time event notifications
- [SDKs](/docs/api-reference/sdks) - Official client libraries

### For Businesses
- [Getting Started](/docs/business/getting-started/welcome) - Platform overview
- [Setting Up](/docs/business/getting-started/setup) - Configure your account
- [Managing Payments](/docs/business/payments/overview) - Accept and send payments
- [Invoicing](/docs/business/payments/invoicing) - Create professional invoices

## Support

- Check out our [API Reference](/docs/api-reference/payments)
- Contact support at jamesthaura51@gmail.com
- [Join our developer community](https://github.com/corridrlabs)
