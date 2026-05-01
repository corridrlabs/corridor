# Model Context Protocol (MCP) Integration

Corridor's Model Context Protocol (MCP) lets AI agents and automations connect to a live Corridor account and execute approved financial operations.

## How agents connect

Agents connect in one of two ways:

1. **Local stdio MCP** for desktop clients like Claude Desktop or Cursor.
2. **Remote HTTP JSON-RPC** for hosted agents, internal automations, and custom apps.

### Local stdio mode

```bash
cd mcp
PAYDAY_API_URL=https://payday-kqgb.onrender.com \
PAYDAY_API_KEY=pk_your_corridor_api_key \
go run ./cmd
```

### Remote HTTP mode

```bash
cd mcp
PAYDAY_API_URL=https://payday-kqgb.onrender.com \
PAYDAY_API_KEY=pk_your_corridor_api_key \
go run ./cmd/http
```

Then call:

- `POST /mcp/messages` for JSON-RPC requests
- `GET /health` for a health check
- `GET /` for service metadata

### JSON-RPC flow

1. Send `initialize`
2. Call `tools/list`
3. Call `tools/call` with a tool name and arguments
4. Use `resources/list` and `resources/read` for read-only data

Example:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"exchange_rate_get","arguments":{"from_currency":"USD","to_currency":"KES"}}}
```

## Authentication

- Account-scoped tools require a valid Corridor API key.
- Create keys from the Corridor app after legal acceptance.
- Public read-only routes can still be called, but the MCP process still expects a non-empty `PAYDAY_API_KEY`.

## What agents can do

- List wallets and balances
- Create payment links and invoices
- Trigger payouts
- Read social goals and resources
- Query FX quotes

## Security notes

- Keep API keys server-side only.
- Use least-privilege API keys for automation.
- Log tool executions for auditability.
