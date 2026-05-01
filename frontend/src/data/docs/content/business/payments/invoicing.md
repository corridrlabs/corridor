# Invoicing

Create and send professional invoices to get paid faster.

## Creating an Invoice

1. Navigate to **Invoices > New Invoice**
2. Add customer details or select from saved contacts
3. Add line items with descriptions and amounts
4. Set payment terms and due date
5. Preview and send

## Invoice Features

### Customization
- Add your company logo
- Customize invoice template
- Add payment instructions
- Include terms and conditions

### Payment Options
Invoices can accept:
- Credit/debit cards
- Bank transfers
- USDC stablecoin
- Solana payments

### Tracking & Reminders
- Real-time payment status
- Automatic payment reminders
- Overdue notifications
- Payment history

## Invoice Statuses

| Status | Description |
|--------|-------------|
| Draft | Invoice is being prepared |
| Sent | Invoice has been emailed to customer |
| Viewed | Customer has opened the invoice |
| Paid | Payment has been received |
| Overdue | Payment is past due date |
| Cancelled | Invoice has been cancelled |

## Sharing Invoices

You can share invoices via:
- **Email** - Send directly from the platform
- **Link** - Copy and share the payment link
- **PDF** - Download and attach to your own emails

## Managing Invoices

### Bulk Actions
- Send multiple invoices at once
- Mark multiple as paid
- Export to CSV for accounting

### Recurring Invoices
Set up recurring invoices for:
- Monthly retainers
- Subscription services
- Regular consulting work

## API Integration

Create invoices programmatically:

```javascript
POST /api/invoices
{
  "customer_id": "cust_123",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unit_price": 150.00
    }
  ],
  "due_date": "2024-02-01"
}
```

## Next Steps

- Learn about [Payment Links](/docs/business/payments/payment-links)
- Set up [Mass Payouts](/docs/business/payments/mass-payouts)
- Explore the [API Reference](/docs/api-reference/overview)
