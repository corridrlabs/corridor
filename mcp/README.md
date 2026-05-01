# Corridor MCP Server

## What is this?

The **Corridor MCP (Model Context Protocol) Server** allows AI agents and developer tools to interact with the Corridor/PayDay platform programmatically.

## How Agents Connect

Agents connect in one of two ways:

1. **Local stdio MCP** for desktop clients such as Claude Desktop or Cursor.
2. **Remote HTTP JSON-RPC** for hosted agents, automations, and custom apps.

## Two Modes

### 1. Local Mode (stdio) - For Desktop AI Agents
Use this with Claude Desktop, Cursor, or any MCP-compatible client.

```bash
cd mcp
go run ./cmd
# Requires: PAYDAY_API_KEY and PAYDAY_API_URL env vars
```

### 2. HTTP Mode - For Remote/Hosted Agents
Deploy this to give AI agents web-based access to your fintech APIs over JSON-RPC.

```bash
cd mcp
go run ./cmd/http
# Or deploy via Docker: docker build -f Dockerfile.http .
```

## Deployed Endpoints (Production)

After deploying via Render:
- **Home**: `https://corridor-mcp.onrender.com/`
- **SSE Stream**: `https://corridor-mcp.onrender.com/mcp/sse`
- **JSON-RPC Messages**: `https://corridor-mcp.onrender.com/mcp/messages`
- **Health**: `https://corridor-mcp.onrender.com/health`

## Remote Connection Example

Your agent or automation should:

1. `POST /mcp/messages` with `{"jsonrpc":"2.0","id":1,"method":"initialize"}`
2. Call `tools/list` to discover available Corridor tools
3. Call `tools/call` with the tool name and arguments
4. Use `resources/list` and `resources/read` for read-only data access

### Example JSON-RPC request

```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"exchange_rate_get","arguments":{"from_currency":"USD","to_currency":"KES"}}}
```

### Example response

```json
{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"..."}]}}
```

## Authentication

- The MCP server needs a Corridor API key in `PAYDAY_API_KEY`.
- Use a real Corridor API key for account-scoped tools such as wallets, invoices, payouts, and API keys.
- For public read-only tools such as `exchange_rate_get`, the endpoint can still work against public API routes, but the MCP server process still expects a non-empty `PAYDAY_API_KEY` at startup.
- Create API keys from the Corridor app under developer settings once the legal consent gate has been accepted.

## Available Tools

| Tool | Description |
|------|-------------|
| `create_payment_link` | Generate shareable payment URLs |
| `get_balance` | Check wallet balances |
| `create_invoice` | Bill customers via email |
| `request_payout` | Send money to M-Pesa or bank |
| `exchange_rate_get` | Get FX quotes between currencies |
| `wallets_list` | List Corridor wallets |
| `social_pay` | Send a social payment |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYDAY_API_KEY` | Yes | Your Corridor API key |
| `PAYDAY_API_URL` | Yes | Backend URL (e.g., `https://corridor-api.onrender.com`) |
| `PORT` | No | HTTP server port (default: 8081) |

## Use Cases

- **AI Accounting Agents**: "Create an invoice for Acme Corp for $500"
- **WhatsApp Bots**: Process payments via natural language
- **Developer Tools**: IDE plugins for fintech operations
- **Automation**: Zapier/Make.com integrations via MCP bridge
