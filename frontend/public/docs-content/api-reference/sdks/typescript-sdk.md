# TypeScript/Node.js SDK Documentation

Modern TypeScript SDK with React hooks, Next.js integration, and full browser support for the Corridor API.

## Installation

```bash
npm install @corridor/sdk
# or
yarn add @corridor/sdk
```

For React integration:
```bash
npm install @corridor/sdk @corridor/react
```

## Quick Start

### Node.js/TypeScript

```typescript
import { CorridorClient } from '@corridor/sdk';

// Initialize client
const client = new CorridorClient({
  apiKey: 'your-api-key',
  environment: 'sandbox' // or 'production'
});

// Create split payment
const payment = await client.payments.createSplit({
  amount: 100.00,
  currency: 'USDC',
  recipients: [
    { walletId: 'wallet-1', percentage: 60 },
    { walletId: 'wallet-2', percentage: 40 }
  ],
  message: 'Team bonus distribution'
});

console.log('Payment created:', payment.id);
```

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@corridor/sdk@latest/dist/corridor.min.js"></script>
</head>
<body>
  <script>
    const client = new Corridor.CorridorClient({
      apiKey: 'your-public-api-key',
      environment: 'sandbox'
    });
    
    // Use client methods
    client.goals.create({
      title: 'Crowdfunding Goal',
      targetAmount: 1000,
      currency: 'USDC'
    }).then(goal => {
      console.log('Goal created:', goal.id);
    });
  </script>
</body>
</html>
```

## Configuration

### Environment Configuration

```typescript
import { CorridorClient, Environment } from '@corridor/sdk';

const client = new CorridorClient({
  apiKey: process.env.PAYDAY_API_KEY!,
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => error.status >= 500
  }
});
```

### Custom Configuration

```typescript
import { CorridorClient, CorridorConfig } from '@corridor/sdk';

const config: CorridorConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api-sandbox.corridormoney.net',
  timeout: 30000,
  headers: {
    'X-Custom-Header': 'value'
  },
  interceptors: {
    request: (config) => {
      console.log('Making request:', config.url);
      return config;
    },
    response: (response) => {
      console.log('Received response:', response.status);
      return response;
    }
  }
};

const client = new CorridorClient(config);
```

## Core Services

### Payments Service

```typescript
import { SplitPaymentRequest, PaymentStatus } from '@corridor/sdk';

// Create split payment
const splitRequest: SplitPaymentRequest = {
  amount: 500.00,
  currency: 'USDC',
  recipients: [
    { walletId: 'wallet-1', percentage: 50 },
    { walletId: 'wallet-2', percentage: 30 },
    { walletId: 'wallet-3', percentage: 20 }
  ]
};

const payment = await client.payments.createSplit(splitRequest);

// Get payment status
const updatedPayment = await client.payments.get(payment.id);
console.log('Payment status:', updatedPayment.status);

// List payments with filtering
const payments = await client.payments.list({
  status: PaymentStatus.Completed,
  currency: 'USDC',
  limit: 50,
  cursor: 'optional-cursor'
});

payments.data.forEach(payment => {
  console.log(`Payment ${payment.id}: ${payment.amount} ${payment.currency}`);
});
```

### Social Goals Service

```typescript
import { CreateGoalRequest, ContributeRequest } from '@corridor/sdk';

// Create crowdfunding goal
const goalRequest: CreateGoalRequest = {
  title: 'Team Building Event',
  description: 'Annual team building and retreat',
  targetAmount: 2000.00,
  currency: 'USDC',
  productLink: 'https://example.com/event-details'
};

const goal = await client.goals.create(goalRequest);

// Contribute to goal
const contribution = await client.goals.contribute(goal.id, {
  contributorName: 'Alice Johnson',
  amount: 50.00,
  currency: 'USDC'
});

console.log('Contribution:', contribution.id);

// Get goal with contributions
const goalWithContributions = await client.goals.get(goal.id, {
  includeContributions: true
});
```

### Wallets Service

```typescript
// Get wallet balance
const balance = await client.wallets.getBalance('wallet-id');
console.log(`Balance: ${balance.amount} ${balance.currency}`);

// List wallets
const wallets = await client.wallets.list({
  accountId: 'account-id',
  currency: 'USDC'
});

// Create new wallet
const wallet = await client.wallets.create({
  accountId: 'account-id',
  currency: 'USDC'
});
```

### EWA Service

```typescript
import { EWARequest, EWAStatus } from '@corridor/sdk';

// Request wage advance (employee)
const ewaRequest: EWARequest = {
  amount: 200.00,
  reason: 'Emergency medical expense'
};

const request = await client.ewa.requestAdvance(ewaRequest);

// Admin: List EWA requests (Tier 2+ required)
const requests = await client.ewa.listRequests({
  status: EWAStatus.Pending,
  limit: 50
});

// Admin: Approve request
await client.ewa.approveRequest(request.id);
```

## React Integration

### Setup Provider

```tsx
import React from 'react';
import { CorridorProvider } from '@corridor/react';

function App() {
  return (
    <CorridorProvider
      apiKey="your-api-key"
      environment="sandbox"
    >
      <YourApp />
    </CorridorProvider>
  );
}
```

### Using Hooks

```tsx
import React, { useState } from 'react';
import { useCorridor, usePayments, useGoals } from '@corridor/react';

function PaymentComponent() {
  const { client } = useCorridor();
  const { createSplitPayment, loading: paymentLoading } = usePayments();
  const { createGoal, loading: goalLoading } = useGoals();
  
  const [amount, setAmount] = useState(100);
  
  const handleSplitPayment = async () => {
    try {
      const payment = await createSplitPayment({
        amount,
        currency: 'USDC',
        recipients: [
          { walletId: 'wallet-1', percentage: 60 },
          { walletId: 'wallet-2', percentage: 40 }
        ]
      });
      
      console.log('Payment created:', payment.id);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };
  
  const handleCreateGoal = async () => {
    try {
      const goal = await createGoal({
        title: 'New Goal',
        targetAmount: 1000,
        currency: 'USDC'
      });
      
      console.log('Goal created:', goal.id);
    } catch (error) {
      console.error('Goal creation failed:', error);
    }
  };
  
  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      
      <button
        onClick={handleSplitPayment}
        disabled={paymentLoading}
      >
        {paymentLoading ? 'Processing...' : 'Create Split Payment'}
      </button>
      
      <button
        onClick={handleCreateGoal}
        disabled={goalLoading}
      >
        {goalLoading ? 'Creating...' : 'Create Goal'}
      </button>
    </div>
  );
}
```

### Data Fetching Hooks

```tsx
import React from 'react';
import { useWallets, usePaymentHistory, useGoalsList } from '@corridor/react';

function Dashboard() {
  const { wallets, loading: walletsLoading, error: walletsError } = useWallets();
  const { payments, loading: paymentsLoading } = usePaymentHistory({ limit: 10 });
  const { goals, loading: goalsLoading } = useGoalsList();
  
  if (walletsLoading || paymentsLoading || goalsLoading) {
    return <div>Loading...</div>;
  }
  
  if (walletsError) {
    return <div>Error loading wallets: {walletsError.message}</div>;
  }
  
  return (
    <div>
      <section>
        <h2>Wallets</h2>
        {wallets.map(wallet => (
          <div key={wallet.id}>
            {wallet.currency}: {wallet.balance}
          </div>
        ))}
      </section>
      
      <section>
        <h2>Recent Payments</h2>
        {payments.map(payment => (
          <div key={payment.id}>
            {payment.amount} {payment.currency} - {payment.status}
          </div>
        ))}
      </section>
      
      <section>
        <h2>Goals</h2>
        {goals.map(goal => (
          <div key={goal.id}>
            {goal.title}: {goal.currentAmount}/{goal.targetAmount}
          </div>
        ))}
      </section>
    </div>
  );
}
```

## Next.js Integration

### API Routes

```typescript
// pages/api/payments/split.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { CorridorClient } from '@corridor/sdk';

const client = new CorridorClient({
  apiKey: process.env.PAYDAY_API_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { amount, currency, recipients } = req.body;
    
    const payment = await client.payments.createSplit({
      amount,
      currency,
      recipients
    });
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Payment creation failed:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
}
```

### Webhook Handler

```typescript
// pages/api/webhooks/corridor.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhookSignature, parseWebhookEvent } from '@corridor/sdk';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Verify webhook signature
    const signature = req.headers['x-corridor-signature'] as string;
    const isValid = verifyWebhookSignature(
      JSON.stringify(req.body),
      signature,
      process.env.PAYDAY_WEBHOOK_SECRET!
    );
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Parse event
    const event = parseWebhookEvent(req.body);
    
    // Handle different event types
    switch (event.type) {
      case 'payment.completed':
        await handlePaymentCompleted(event.data);
        break;
      case 'goal.completed':
        await handleGoalCompleted(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
}

async function handlePaymentCompleted(data: any) {
  // Update your database, send notifications, etc.
  console.log('Payment completed:', data.paymentId);
}

async function handleGoalCompleted(data: any) {
  // Handle goal completion
  console.log('Goal completed:', data.goalId);
}
```

### Server-Side Rendering

```tsx
// pages/dashboard.tsx
import { GetServerSideProps } from 'next';
import { CorridorClient } from '@corridor/sdk';

interface DashboardProps {
  wallets: Wallet[];
  goals: Goal[];
}

export default function Dashboard({ wallets, goals }: DashboardProps) {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <section>
        <h2>Wallets</h2>
        {wallets.map(wallet => (
          <div key={wallet.id}>
            {wallet.currency}: {wallet.balance}
          </div>
        ))}
      </section>
      
      <section>
        <h2>Goals</h2>
        {goals.map(goal => (
          <div key={goal.id}>
            {goal.title}: {goal.currentAmount}/{goal.targetAmount}
          </div>
        ))}
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const client = new CorridorClient({
    apiKey: process.env.PAYDAY_API_KEY!
  });
  
  try {
    const [wallets, goals] = await Promise.all([
      client.wallets.list({ accountId: 'user-account-id' }),
      client.goals.list({ accountId: 'user-account-id' })
    ]);
    
    return {
      props: {
        wallets: wallets.data,
        goals: goals.data
      }
    };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return {
      props: {
        wallets: [],
        goals: []
      }
    };
  }
};
```

## Error Handling

```typescript
import {
  CorridorError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  APIError
} from '@corridor/sdk';

try {
  const payment = await client.payments.createSplit({
    amount: 100,
    currency: 'USDC',
    recipients: [] // Invalid: empty recipients
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
    console.log('Field errors:', error.fieldErrors);
  } else if (error instanceof AuthenticationError) {
    console.log('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof APIError) {
    console.log(`API error ${error.statusCode}:`, error.message);
  } else if (error instanceof CorridorError) {
    console.log('Corridor error:', error.message);
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## TypeScript Types

```typescript
import {
  SplitPayment,
  SplitPaymentRequest,
  Goal,
  CreateGoalRequest,
  Wallet,
  EWARequest,
  PaymentStatus,
  GoalStatus,
  Currency
} from '@corridor/sdk';

// Type-safe payment creation
const createPayment = async (request: SplitPaymentRequest): Promise<SplitPayment> => {
  return await client.payments.createSplit(request);
};

// Type-safe goal creation
const createGoal = async (request: CreateGoalRequest): Promise<Goal> => {
  return await client.goals.create(request);
};

// Enum usage
const filterPayments = async (status: PaymentStatus, currency: Currency) => {
  return await client.payments.list({ status, currency });
};
```

## Testing

### Jest Setup

```typescript
// jest.setup.ts
import { CorridorClient } from '@corridor/sdk';

// Mock the SDK for testing
jest.mock('@corridor/sdk', () => ({
  CorridorClient: jest.fn().mockImplementation(() => ({
    payments: {
      createSplit: jest.fn(),
      get: jest.fn(),
      list: jest.fn()
    },
    goals: {
      create: jest.fn(),
      contribute: jest.fn(),
      get: jest.fn()
    }
  }))
}));
```

### Test Examples

```typescript
import { CorridorClient } from '@corridor/sdk';
import { createTeamPayment } from '../src/payments';

// Mock the client
const mockClient = new CorridorClient({ apiKey: 'test' }) as jest.Mocked<CorridorClient>;

describe('Team Payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create split payment for team', async () => {
    // Setup mock
    const mockPayment = {
      id: 'split_123',
      status: 'completed',
      amount: 1000,
      currency: 'USDC'
    };
    
    mockClient.payments.createSplit.mockResolvedValue(mockPayment);
    
    // Test
    const result = await createTeamPayment(mockClient, {
      teamId: 'team_1',
      amount: 1000,
      currency: 'USDC'
    });
    
    // Assertions
    expect(result.id).toBe('split_123');
    expect(mockClient.payments.createSplit).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'USDC',
      recipients: expect.any(Array)
    });
  });
});
```

## Examples

### Complete Payment Flow

```typescript
import { CorridorClient, PaymentStatus } from '@corridor/sdk';

class PaymentService {
  private client: CorridorClient;
  
  constructor(apiKey: string) {
    this.client = new CorridorClient({ apiKey });
  }
  
  async processTeamBonus(
    teamMembers: Array<{ walletId: string; performanceScore: number }>,
    totalAmount: number
  ) {
    // Calculate percentages based on performance
    const totalScore = teamMembers.reduce((sum, member) => sum + member.performanceScore, 0);
    
    const recipients = teamMembers.map(member => ({
      walletId: member.walletId,
      percentage: (member.performanceScore / totalScore) * 100
    }));
    
    // Create split payment
    const payment = await this.client.payments.createSplit({
      amount: totalAmount,
      currency: 'USDC',
      recipients,
      message: 'Q4 Performance Bonus'
    });
    
    // Wait for completion
    return this.waitForCompletion(payment.id);
  }
  
  private async waitForCompletion(paymentId: string, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const payment = await this.client.payments.get(paymentId);
      
      if (payment.status === PaymentStatus.Completed) {
        return payment;
      } else if (payment.status === PaymentStatus.Failed) {
        throw new Error(`Payment failed: ${payment.failureReason}`);
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Payment completion timeout');
  }
}
```

## Support

- **Documentation**: [https://docs.corridormoney.net/typescript-sdk](https://docs.corridormoney.net/typescript-sdk)
- **GitHub**: [https://github.com/corridor/corridor-js](https://github.com/corridor/corridor-js)
- **NPM**: [https://www.npmjs.com/package/@corridor/sdk](https://www.npmjs.com/package/@corridor/sdk)
- **Issues**: [https://github.com/corridor/corridor-js/issues](https://github.com/corridor/corridor-js/issues)
- **Email**: developers@corridormoney.net