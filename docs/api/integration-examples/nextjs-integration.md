# Next.js Integration Guide

This guide shows how to integrate Corridor's payment infrastructure into a Next.js application for seamless payment processing and financial operations.

## Installation

```bash
npm install @corridor/sdk @corridor/react
# or
yarn add @corridor/sdk @corridor/react
```

## Environment Setup

Create a `.env.local` file in your project root:

```env
PAYDAY_API_KEY=your_api_key_here
PAYDAY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_PAYDAY_ENVIRONMENT=sandbox
```

## Provider Setup

Create a Corridor provider to wrap your application:

```tsx
// lib/corridor-provider.tsx
'use client';

import { CorridorProvider } from '@corridor/react';
import { ReactNode } from 'react';

interface CorridorWrapperProps {
  children: ReactNode;
}

export function CorridorWrapper({ children }: CorridorWrapperProps) {
  return (
    <CorridorProvider
      apiKey={process.env.NEXT_PUBLIC_PAYDAY_API_KEY!}
      environment={process.env.NEXT_PUBLIC_PAYDAY_ENVIRONMENT as 'sandbox' | 'production'}
    >
      {children}
    </CorridorProvider>
  );
}
```

Update your root layout:

```tsx
// app/layout.tsx
import { CorridorWrapper } from '@/lib/corridor-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CorridorWrapper>
          {children}
        </CorridorWrapper>
      </body>
    </html>
  );
}
```

## API Routes

### Split Payment Endpoint

```tsx
// app/api/payments/split/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CorridorClient } from '@corridor/sdk';

const client = new CorridorClient({
  apiKey: process.env.PAYDAY_API_KEY!,
  environment: process.env.NEXT_PUBLIC_PAYDAY_ENVIRONMENT as 'sandbox' | 'production'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, recipients, message } = body;

    // Validate input
    if (!amount || !currency || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create split payment
    const payment = await client.payments.createSplit({
      amount,
      currency,
      recipients,
      message
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Split payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create split payment' },
      { status: 500 }
    );
  }
}
```

### Goal Management Endpoints

```tsx
// app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CorridorClient } from '@corridor/sdk';

const client = new CorridorClient({
  apiKey: process.env.PAYDAY_API_KEY!
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const goals = await client.goals.list({
      accountId: accountId || undefined,
      limit: 50
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Goals fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, targetAmount, currency, productLink } = body;

    const goal = await client.goals.create({
      title,
      description,
      targetAmount,
      currency,
      productLink
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Goal creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
```

### Webhook Handler

```tsx
// app/api/webhooks/corridor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, parseWebhookEvent } from '@corridor/sdk';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-corridor-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.PAYDAY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    const event = parseWebhookEvent(JSON.parse(body));

    // Handle different event types
    switch (event.type) {
      case 'payment.completed':
        await handlePaymentCompleted(event.data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;
      case 'goal.completed':
        await handleGoalCompleted(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

async function handlePaymentCompleted(data: any) {
  console.log('Payment completed:', data.paymentId);
  
  // Update your database
  // Send notifications
  // Trigger other business logic
}

async function handlePaymentFailed(data: any) {
  console.log('Payment failed:', data.paymentId, data.error);
  
  // Handle payment failure
  // Notify users
  // Log for investigation
}

async function handleGoalCompleted(data: any) {
  console.log('Goal completed:', data.goalId);
  
  // Celebrate goal completion
  // Send congratulations
  // Process rewards
}
```

## React Components

### Split Payment Component

```tsx
// components/SplitPaymentForm.tsx
'use client';

import { useState } from 'react';
import { usePayments } from '@corridor/react';

interface Recipient {
  walletId: string;
  percentage: number;
  name: string;
}

export function SplitPaymentForm() {
  const { createSplitPayment, loading } = usePayments();
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USDC');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { walletId: '', percentage: 0, name: '' }
  ]);
  const [message, setMessage] = useState<string>('');

  const addRecipient = () => {
    setRecipients([...recipients, { walletId: '', percentage: 0, name: '' }]);
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string | number) => {
    const updated = recipients.map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    );
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payment = await createSplitPayment({
        amount,
        currency,
        recipients: recipients.map(r => ({
          walletId: r.walletId,
          percentage: r.percentage
        })),
        message
      });

      alert(`Payment created successfully! ID: ${payment.id}`);
      
      // Reset form
      setAmount(0);
      setRecipients([{ walletId: '', percentage: 0, name: '' }]);
      setMessage('');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Split Payment</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USDC">USDC</option>
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Payment description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Recipients</h3>
            <button
              type="button"
              onClick={addRecipient}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Recipient
            </button>
          </div>

          <div className="space-y-4">
            {recipients.map((recipient, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border border-gray-200 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                    placeholder="Recipient name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wallet ID
                  </label>
                  <input
                    type="text"
                    value={recipient.walletId}
                    onChange={(e) => updateRecipient(index, 'walletId', e.target.value)}
                    placeholder="wallet-id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={recipient.percentage}
                    onChange={(e) => updateRecipient(index, 'percentage', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    disabled={recipients.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Percentage:</span>
              <span className={`font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPercentage}%
              </span>
            </div>
            {totalPercentage !== 100 && (
              <p className="text-sm text-red-600 mt-1">
                Total percentage must equal 100%
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || totalPercentage !== 100 || recipients.some(r => !r.walletId)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Payment...' : 'Create Split Payment'}
        </button>
      </form>
    </div>
  );
}
```

### Goal Creation Component

```tsx
// components/GoalForm.tsx
'use client';

import { useState } from 'react';
import { useGoals } from '@corridor/react';

export function GoalForm() {
  const { createGoal, loading } = useGoals();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: 0,
    currency: 'USDC',
    productLink: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const goal = await createGoal(formData);
      alert(`Goal created successfully! Share link: ${goal.shareLink}`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        targetAmount: 0,
        currency: 'USDC',
        productLink: ''
      });
    } catch (error) {
      console.error('Goal creation failed:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'targetAmount' ? Number(value) : value
    }));
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Crowdfunding Goal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Team Building Event"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your goal..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Amount
            </label>
            <input
              type="number"
              name="targetAmount"
              step="0.01"
              value={formData.targetAmount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USDC">USDC</option>
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Link (Optional)
          </label>
          <input
            type="url"
            name="productLink"
            value={formData.productLink}
            onChange={handleChange}
            placeholder="https://example.com/product"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating Goal...' : 'Create Goal'}
        </button>
      </form>
    </div>
  );
}
```

### Dashboard Component

```tsx
// components/CorridorDashboard.tsx
'use client';

import { useWallets, usePaymentHistory, useGoalsList } from '@corridor/react';

export function CorridorDashboard() {
  const { wallets, loading: walletsLoading, error: walletsError } = useWallets();
  const { payments, loading: paymentsLoading } = usePaymentHistory({ limit: 5 });
  const { goals, loading: goalsLoading } = useGoalsList({ limit: 3 });

  if (walletsLoading || paymentsLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (walletsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading dashboard: {walletsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Wallets Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wallets.map(wallet => (
            <div key={wallet.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{wallet.currency} Wallet</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {wallet.balance.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{wallet.currency[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Payments */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Payments</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {payments.map(payment => (
              <div key={payment.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {payment.message || 'Payment'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {payment.amount} {payment.currency}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Goals */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-medium text-gray-900 mb-2">{goal.title}</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{goal.currentAmount.toFixed(2)} {goal.currency}</span>
                  <span>{goal.targetAmount.toFixed(2)} {goal.currency}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}% funded
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

## Server-Side Data Fetching

```tsx
// app/dashboard/page.tsx
import { CorridorClient } from '@corridor/sdk';
import { CorridorDashboard } from '@/components/CorridorDashboard';

async function getDashboardData() {
  const client = new CorridorClient({
    apiKey: process.env.PAYDAY_API_KEY!
  });

  try {
    const [wallets, payments, goals] = await Promise.all([
      client.wallets.list({ accountId: 'user-account-id' }),
      client.payments.list({ limit: 10 }),
      client.goals.list({ limit: 5 })
    ]);

    return { wallets, payments, goals };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return { wallets: [], payments: [], goals: [] };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <CorridorDashboard initialData={data} />
    </div>
  );
}
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `PAYDAY_API_KEY`
   - `PAYDAY_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_PAYDAY_ENVIRONMENT`

### Environment Variables

```bash
# Production
PAYDAY_API_KEY=pk_live_your_production_key
PAYDAY_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_PAYDAY_ENVIRONMENT=production

# Development
PAYDAY_API_KEY=pk_test_your_sandbox_key
PAYDAY_WEBHOOK_SECRET=whsec_your_test_webhook_secret
NEXT_PUBLIC_PAYDAY_ENVIRONMENT=sandbox
```

## Best Practices

1. **Error Handling**: Always wrap Corridor API calls in try-catch blocks
2. **Loading States**: Show loading indicators during API operations
3. **Validation**: Validate user input before sending to Corridor APIs
4. **Security**: Never expose API keys in client-side code
5. **Webhooks**: Always verify webhook signatures for security
6. **Rate Limiting**: Implement client-side rate limiting for better UX

## Support

For Next.js specific integration help:
- Email: developers@corridormoney.net
- Documentation: https://docs.corridormoney.net/integrations/nextjs
- GitHub Issues: https://github.com/corridor/corridor-js/issues