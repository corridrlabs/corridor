# Payments API

Corridor's Payments API provides a robust multi-rail platform for managing both fiat and cryptocurrency transactions, enabling you to charge customers, facilitate social payments, track payment status, and issue refunds. Our infrastructure supports direct payments for core services and integrates with external processors like Paystack for fiat deposits and withdrawals.

## Creating a Payment

Use this endpoint for direct payments within the Corridor ecosystem, primarily for internal transfers or when specific payment rails are not required.

```http
POST /v1/payments
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

Example request body:

```json
{
  "amount": 10000,
  "currency": "KES",
  "customer_id": "cust_123",
  "description": "Invoice #123",
  "metadata": {
    "order_number": "123"
  }
}
```

Key fields:

-   `amount` – integer, smallest currency unit (e.g. cents)
-   `currency` – ISO currency code (e.g. `KES`)
-   `customer_id` – your internal customer reference
-   `metadata` – optional key/value pairs that are echoed back in webhooks

## Payment Gateways (Deposits & Withdrawals)

Corridor integrates with external payment gateways to facilitate fiat deposits and withdrawals to and from your Corridor account. **Paystack** is our primary external processor for many regions, enabling seamless bank transfers and card payments.

### Initializing a Paystack Deposit

To initiate a deposit via Paystack, your application will typically make a request to a Corridor endpoint that then redirects or provides an authorization URL from Paystack.

**Example (Conceptual Flow):**

1.  Your backend requests a deposit initiation from Corridor's API.
2.  Corridor's API calls Paystack, receiving an authorization URL.
3.  Your frontend redirects the user to this Paystack URL to complete the payment.
4.  Upon completion, Paystack notifies Corridor via webhook.

### Handling Paystack Webhooks

Corridor processes webhooks from Paystack to update transaction statuses. You typically don't interact directly with these webhooks unless you're mirroring Corridor's functionality. Key events include:

-   `charge.success`: A payment initiated by a user has been successfully completed.
-   `transfer.success`: A withdrawal/transfer initiated by Corridor to a user's bank account has succeeded.
-   `transfer.failed`: A withdrawal/transfer initiated by Corridor has failed.

## Multi-Rail Fiat & Crypto

Corridor is designed as a multi-rail platform, supporting both traditional fiat currencies and various cryptocurrencies. This allows for flexible deposits, withdrawals, and payments across different asset types. Specific endpoints and methods for crypto operations will be detailed in dedicated sections or as part of our `sdks` documentation.

## Social Payments

Corridor offers powerful social payment features, including cost splitting and crowdfunding, designed to make group payments and fundraising effortless.

### Contributing to a Goal (Crowdfunding/Split Payments)

Users can contribute to specific social goals or split the cost of an item. These contributions can be anonymous or attributed. The `v1/contributions` endpoint facilitates these actions.

```http
POST /v1/contributions
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

Example Request Body:

```json
{
  "goal_id": "goal_abc",
  "amount": 5000,
  "currency": "KES",
  "contributor_id": "user_xyz", // Optional, for attributed contributions
  "anonymous": false,
  "metadata": {
    "message": "Good luck with your project!"
  }
}
```

## Reading Payments

```http
GET /v1/payments/{payment_id}
```

Returns the latest state for a single payment.

```http
GET /v1/payments?limit=20&status=succeeded
```

Lists payments with basic filtering and pagination.

## Refunds

```http
POST /v1/payments/{payment_id}/refunds
```

Creates a refund for an existing payment. Refund events are also sent via webhooks.
