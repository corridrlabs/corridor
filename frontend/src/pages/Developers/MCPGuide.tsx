import React from 'react';
import { Bot, Terminal, Shield, Wrench, Server } from 'lucide-react';

const MCPGuide = () => {
    const claudeConfig = `{
  "mcpServers": {
    "corridor": {
      "command": "/path/to/corridor-mcp",
      "env": {
        "CORRIDOR_API_KEY": "pk_live_...",
        "CORRIDOR_API_URL": "YOUR_API_BASE_URL"
      }
    }
  }
}`;

    const cursorConfig = `{
  "mcp.servers": [
    {
      "name": "corridor",
      "command": "/path/to/corridor-mcp",
      "env": {
        "CORRIDOR_API_KEY": "pk_live_...",
        "CORRIDOR_API_URL": "YOUR_API_BASE_URL"
      }
    }
  ]
}`;

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6">
                <div className="mb-3 flex items-center gap-2 text-indigo-700">
                    <Bot className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">MCP Integration Guide</h2>
                </div>
                <p className="text-sm text-indigo-900">
                    Use Corridor via Model Context Protocol from AI tools like Claude Desktop and Cursor. This gives agent-driven access to wallets, funding, payouts, invoices, payment links, webhooks, and social goal flows.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2 text-gray-900">
                    <Terminal className="h-5 w-5" />
                    <h3 className="text-base font-semibold">1. Build and Run</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                    <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
{`cd mcp
go build -o corridor-mcp ./cmd

export CORRIDOR_API_KEY="pk_live_..."
export CORRIDOR_API_URL="YOUR_API_BASE_URL"

./corridor-mcp`}
                    </pre>
                    <p>Use a backend-issued API key and keep it server-side only.</p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2 text-gray-900">
                    <Server className="h-5 w-5" />
                    <h3 className="text-base font-semibold">2. Connect in AI Client</h3>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Claude Desktop</p>
                        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">{claudeConfig}</pre>
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Cursor</p>
                        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">{cursorConfig}</pre>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2 text-gray-900">
                    <Wrench className="h-5 w-5" />
                    <h3 className="text-base font-semibold">3. Common MCP Tools</h3>
                </div>
                <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-3"><code>wallets_list</code>, <code>wallets_create</code></div>
                    <div className="rounded-lg border border-gray-200 p-3"><code>funding_sources_list</code>, <code>fund_wallet</code></div>
                    <div className="rounded-lg border border-gray-200 p-3"><code>payouts_list</code>, <code>payouts_create</code></div>
                    <div className="rounded-lg border border-gray-200 p-3"><code>payment_links_create</code>, <code>invoices_create</code></div>
                    <div className="rounded-lg border border-gray-200 p-3"><code>webhooks_create</code>, <code>webhooks_list</code></div>
                    <div className="rounded-lg border border-gray-200 p-3"><code>social_goals_create</code>, <code>social_goal_contribute</code></div>
                </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                <div className="mb-3 flex items-center gap-2 text-amber-800">
                    <Shield className="h-5 w-5" />
                    <h3 className="text-base font-semibold">Security and Billing Rules</h3>
                </div>
                <div className="space-y-2 text-sm text-amber-900">
                    <p>Some routes are plan-gated and return <code>402 Payment Required</code> when the account tier does not include access.</p>
                    <p>Use <code>idempotency_key</code> on mutating tools for safe retries (<code>fund_wallet</code>, <code>payouts_create</code>, <code>payment_links_create</code>).</p>
                    <p>Payouts apply platform fees based on plan tier.</p>
                </div>
            </div>
        </div>
    );
};

export default MCPGuide;
