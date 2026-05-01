# SDKs & Client Libraries

To speed up integrations, Corridor provides official client libraries for popular languages.

## Why use an SDK?

- Handles authentication and HTTP details for you
- Provides typed models where possible
- Encodes best practices for retries and error handling

## Example: JavaScript/TypeScript

```ts
import { Corridor } from '@corridor/sdk';

const client = new Corridor({
  apiKey: process.env.CORRIDOR_API_KEY!,
  environment: 'sandbox'
});

const payment = await client.payments.create({
  amount: 10000,
  currency: 'KES',
  customerId: 'cust_123',
});
```

## Other languages

- **Python** – `corridor-python`
- **Go** – `corridor-go`
- **PHP** – `corridor-php`
- **Ruby** – `corridor-ruby`

Check the API reference for the exact package names and install instructions for each language.
