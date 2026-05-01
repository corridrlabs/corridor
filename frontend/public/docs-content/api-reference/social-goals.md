# Social Goals API

The Social Goals API enables crowdfunding and group payment collection.

## Overview

Social Goals allow you to:
- Create fundraising campaigns with shareable links
- Accept contributions from anyone (no account required)
- Track progress toward funding targets
- Withdraw funds to your connected wallet

## Use Cases

- **Group gifts**: Collect money for a birthday present
- **Event planning**: Fund team outings or parties
- **Charity**: Raise money for causes
- **Split expenses**: Share costs among a group
- **Community projects**: Fund local initiatives

## Create a Goal

```bash
POST /api/social/goals
```

### Request

```json
{
  "title": "Office Pizza Fund",
  "description": "Weekly pizza for the team",
  "target_amount": 50.00,
  "currency": "USDC",
  "product_link": "https://pizzaplace.com/large-pepperoni"
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "account_id": "user-uuid",
  "title": "Office Pizza Fund",
  "description": "Weekly pizza for the team",
  "target_amount": 50.00,
  "current_amount": 0.00,
  "currency": "USDC",
  "product_link": "https://pizzaplace.com/large-pepperoni",
  "share_link": "https://corridormoney.net/goals/abc12345",
  "status": "ACTIVE",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## List Your Goals

```bash
GET /api/social/goals
```

### Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Office Pizza Fund",
    "target_amount": 50.00,
    "current_amount": 35.00,
    "currency": "USDC",
    "status": "ACTIVE"
  },
  {
    "id": "661e8400-e29b-41d4-a716-446655440001",
    "title": "Team Building Event",
    "target_amount": 500.00,
    "current_amount": 500.00,
    "currency": "USDC",
    "status": "COMPLETED"
  }
]
```

## Get Goal by Share Link

```bash
GET /api/social/goals/link?link=https://corridormoney.net/goals/abc12345
```

No authentication required - allows public viewing of goal details.

## Contribute to a Goal

```bash
POST /api/social/goals/contribute
```

### Request

```json
{
  "goal_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 10.00,
  "currency": "USDC",
  "contributor_name": "Alice"
}
```

**Note**: No authentication required for contributions. The `contributor_name` defaults to "Anonymous" if not provided.

### Response

```json
{
  "id": "contrib-uuid",
  "goal_id": "550e8400-e29b-41d4-a716-446655440000",
  "contributor_name": "Alice",
  "amount": 10.00,
  "currency": "USDC",
  "transaction_id": "tx-uuid",
  "created_at": "2024-01-15T11:00:00Z"
}
```

## Withdraw Funds (Eject)

When your goal has collected funds, withdraw them to your connected wallet:

```bash
POST /api/social/goals/eject
```

### Request

```json
{
  "goal_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response

```json
{
  "message": "Successfully ejected 35.00 USDC to external wallet 7xKX..."
}
```

**Requirements**:
- Must be the goal owner
- Must have a connected wallet address
- Goal must have funds to withdraw

## Goal Status Values

| Status | Description |
|--------|-------------|
| `ACTIVE` | Goal is open for contributions |
| `COMPLETED` | Target reached or funds withdrawn |
| `CANCELLED` | Goal was cancelled by owner |
| `EXPIRED` | Goal reached expiration date |

## Supported Currencies

| Currency | Description |
|----------|-------------|
| `USDC` | USD Coin (stablecoin) |
| `USD` | US Dollar (fiat) |
| `KES` | Kenyan Shilling |
| `NGN` | Nigerian Naira |

## Webhooks

Get notified when contributions are made. See [Webhooks](./webhooks.md) for setup.

## Best Practices

1. **Clear titles**: Use descriptive titles that explain the goal
2. **Set realistic targets**: Goals with achievable targets get more contributions
3. **Share widely**: Use the share link on social media, chat groups, etc.
4. **Update contributors**: Keep your group informed of progress
5. **Withdraw promptly**: Eject funds once the goal is met

## Error Codes

| Error | Description |
|-------|-------------|
| `goal_not_found` | The specified goal doesn't exist |
| `goal_not_active` | Can't contribute to inactive goals |
| `no_funds_to_eject` | Goal has no funds to withdraw |
| `no_wallet_connected` | Must connect a wallet to withdraw |
| `unauthorized` | Not the goal owner (for eject) |
