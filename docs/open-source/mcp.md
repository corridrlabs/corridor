# MCP and Agent Tools

MCP is the agent-facing layer for Corridor. It lets AI systems call approved Corridor operations without inventing their own integration logic.

## Purpose

- Expose vetted tools to desktop clients, hosted agents, and automation systems.
- Provide a stable interface for AI-native workflows.
- Separate read-only resources from action-oriented tools.

## Transport modes

1. **Local stdio** for desktop clients like Claude Desktop or Cursor.
2. **Remote HTTP JSON-RPC** for hosted agents and internal automations.

## Core features

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`
- Authenticated account-scoped operations
- Public read-only operations where appropriate

## Implementation scope

- `mcp` holds the server implementation.
- `mcp-tools` can hold shared tool definitions, schemas, and helpers.
- Tool output should be deterministic and auditable.
- Public docs must show how agents connect and authenticate.

## Good MCP use cases

- Create a payment link
- List wallets
- Fetch FX quotes
- Read social goals
- Generate invoices
- Trigger approved automations

## What should stay out of MCP

- Hidden side effects.
- Undocumented privileged operations.
- Secrets or raw internal database access.

