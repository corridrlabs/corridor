import React, { useState } from 'react';
import { Download, ExternalLink, Code, Star, GitBranch } from 'lucide-react';

interface SDK {
  name: string;
  language: string;
  version: string;
  description: string;
  installCommand: string;
  quickStart: string;
  features: string[];
  githubUrl: string;
  docsUrl: string;
  downloads: string;
  stars: number;
}

const sdks: SDK[] = [
  {
    name: 'corridor-go',
    language: 'Go',
    version: 'v1.2.0',
    description: 'Official Go client library for Corridor API with full type safety and comprehensive error handling.',
    installCommand: 'go get github.com/corridor/corridor-go',
    quickStart: `package main

import (
    "context"
    "github.com/corridor/corridor-go"
)

func main() {
    client := corridor.NewClient("your-api-key")
    
    payment, err := client.Payments.CreateSplit(context.Background(), &corridor.SplitPaymentRequest{
        Amount:   100.00,
        Currency: "USDC",
        Recipients: []corridor.Recipient{
            {WalletID: "uuid-1", Percentage: 60},
            {WalletID: "uuid-2", Percentage: 40},
        },
    })
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Payment ID: %s\\n", payment.ID)
}`,
    features: ['Type-safe API calls', 'Automatic retries', 'Context support', 'Webhook verification'],
    githubUrl: 'https://github.com/corridor/corridor-go',
    docsUrl: '/docs/api/sdks/go-sdk',
    downloads: '50K+',
    stars: 234
  },
  {
    name: 'corridor-python',
    language: 'Python',
    version: 'v1.1.5',
    description: 'Python SDK with async support, comprehensive error handling, and Django/Flask integrations.',
    installCommand: 'pip install corridor-python',
    quickStart: `from corridor import CorridorClient

client = CorridorClient(api_key="your-api-key")

# Create split payment
payment = client.payments.create_split(
    amount=100.00,
    currency="USDC",
    recipients=[
        {"wallet_id": "uuid-1", "percentage": 60},
        {"wallet_id": "uuid-2", "percentage": 40}
    ]
)

print(f"Payment ID: {payment.id}")

# Async support
import asyncio
from corridor import AsyncCorridorClient

async def main():
    async_client = AsyncCorridorClient(api_key="your-api-key")
    payment = await async_client.payments.create_split(...)
    print(payment.id)

asyncio.run(main())`,
    features: ['Async/await support', 'Django integration', 'Type hints', 'Webhook helpers'],
    githubUrl: 'https://github.com/corridor/corridor-python',
    docsUrl: '/docs/api/sdks/python-sdk',
    downloads: '75K+',
    stars: 189
  },
  {
    name: 'corridor-js',
    language: 'TypeScript/Node.js',
    version: 'v2.0.1',
    description: 'Modern TypeScript SDK with React hooks, Next.js integration, and browser support.',
    installCommand: 'npm install @corridor/sdk',
    quickStart: `import { CorridorClient } from '@corridor/sdk';

const client = new CorridorClient({
  apiKey: 'your-api-key',
  environment: 'sandbox' // or 'production'
});

// Create split payment
const payment = await client.payments.createSplit({
  amount: 100.00,
  currency: 'USDC',
  recipients: [
    { walletId: 'uuid-1', percentage: 60 },
    { walletId: 'uuid-2', percentage: 40 }
  ]
});

console.log('Payment ID:', payment.id);

// React Hook example
import { useCorridor } from '@corridor/sdk/react';

function PaymentComponent() {
  const { createSplitPayment, loading } = useCorridor();
  
  const handlePayment = async () => {
    const payment = await createSplitPayment({
      amount: 100,
      currency: 'USDC',
      recipients: [...]
    });
  };
  
  return <button onClick={handlePayment} disabled={loading}>Pay</button>;
}`,
    features: ['React hooks', 'Next.js integration', 'Browser support', 'TypeScript types'],
    githubUrl: 'https://github.com/corridor/corridor-js',
    docsUrl: '/docs/api/sdks/typescript-sdk',
    downloads: '120K+',
    stars: 456
  },
  {
    name: 'corridor-rust',
    language: 'Rust',
    version: 'v0.8.2',
    description: 'High-performance Rust client with zero-cost abstractions and comprehensive error handling.',
    installCommand: 'cargo add corridor',
    quickStart: `use corridor::{CorridorClient, SplitPaymentRequest, Recipient};
use tokio;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = CorridorClient::new("your-api-key");
    
    let payment = client.payments().create_split(SplitPaymentRequest {
        amount: 100.0,
        currency: "USDC".to_string(),
        recipients: vec![
            Recipient { wallet_id: "uuid-1".to_string(), percentage: 60 },
            Recipient { wallet_id: "uuid-2".to_string(), percentage: 40 },
        ],
    }).await?;
    
    println!("Payment ID: {}", payment.id);
    Ok(())
}`,
    features: ['Zero-cost abstractions', 'Async/await', 'Comprehensive error types', 'Serde integration'],
    githubUrl: 'https://github.com/corridor/corridor-rust',
    docsUrl: '/docs/api/sdks/rust-sdk',
    downloads: '15K+',
    stars: 98
  }
];

export default function SDKs() {
  const [selectedSDK, setSelectedSDK] = useState<SDK>(sdks[0]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Client SDKs</h1>
        <p className="text-gray-600">
          Official client libraries for popular programming languages. Get started quickly with type-safe APIs and comprehensive documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {sdks.map((sdk) => (
          <div
            key={sdk.name}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedSDK.name === sdk.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedSDK(sdk)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{sdk.language}</h3>
              <span className="text-xs text-gray-500">{sdk.version}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center space-x-1">
                <Download className="w-3 h-3" />
                <span>{sdk.downloads}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>{sdk.stars}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{sdk.description.substring(0, 80)}...</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Installation & Quick Start */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Installation</h3>
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-sm">{selectedSDK.installCommand}</code>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h3>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
              <code>{selectedSDK.quickStart}</code>
            </pre>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <ul className="space-y-2">
              {selectedSDK.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resources & Links */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
            <div className="space-y-3">
              <a
                href={selectedSDK.githubUrl}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <GitBranch className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">GitHub Repository</div>
                  <div className="text-sm text-gray-600">Source code, issues, and contributions</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>

              <a
                href={selectedSDK.docsUrl}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <Code className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Documentation</div>
                  <div className="text-sm text-gray-600">Complete API reference and guides</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Examples</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-900 mb-1">Basic Payment</div>
                <div className="text-sm text-gray-600">Simple payment processing example</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-900 mb-1">Split Payments</div>
                <div className="text-sm text-gray-600">Multi-recipient payment splitting</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-900 mb-1">Webhook Handling</div>
                <div className="text-sm text-gray-600">Process webhook events securely</div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Support</h3>
            <p className="text-sm text-gray-600 mb-3">
              Need help with the {selectedSDK.language} SDK? We're here to help.
            </p>
            <div className="space-y-2">
              <a href="mailto:developers@corridormoney.net" className="text-blue-600 hover:text-blue-700 text-sm">
                developers@corridormoney.net
              </a>
              <br />
              <a href="/docs/support" className="text-blue-600 hover:text-blue-700 text-sm">
                Developer Support Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}