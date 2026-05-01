# API Contracts

API contracts are the canonical machine-readable definition of Corridor behavior.

## Purpose

- Define request and response shapes.
- Document authentication and authorization rules.
- Lock down webhooks, events, and idempotency behavior.
- Support generation of SDKs and MCP schemas.

## Contract sources

- `openapi` for the authored API specification.
- `api-specs` for versioned schemas, exports, and generated snapshots.
- Docs in `docs/api/` for narrative explanations.

## Core features

- OpenAPI validation in CI.
- Versioned breaking-change tracking.
- Webhook event catalog.
- Schema examples for every public endpoint.
- Machine-readable export for SDK generation.

## Implementation scope

- Treat the contract repo as the source of truth for public API changes.
- Generate SDKs and client types from the contract definitions.
- Reject undocumented breaking changes.
- Keep examples and docs aligned with the contract release.

## What belongs here

- Endpoint definitions
- Schema objects
- Authentication rules
- Error models
- Webhook event payloads
- Idempotency and rate limit rules

