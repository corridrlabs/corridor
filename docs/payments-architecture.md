# Corridor Payment & Wallet Architecture (Stablecoin-first)

## Objectives
- Borderless payments with fiat<>stablecoin<>fiat paths (USD/KES/NGN + USDC/USDT).
- Production-grade wallet layer for balances, compliance, and audit.
- Connector strategy that reuses existing bank/mobile money rails plus new crypto ramps.
- Clear migration path from current state to phased rollout; no placeholders.

## Target Stack
- **Ledger & Wallets**: Double-entry wallet service (customer, business, treasury) with subledgers for fiat, stablecoin, and fees. Deterministic idempotency keys on every movement.
- **Rails**
  - Bank & Mobile Money: existing connectors (`flutterwave`, `monnify`, `cellulant`, `equity`, `kcb`, `absa`, `ecobank`).
  - Stablecoin rails: USDC on Solana + EVM (as fallback) with custody via Fireblocks/self-custody module; FX paths via on/off-ramp partners.
  - WhatsApp/USSD: webhook-driven flows calling wallet + connectors.
- **Services**
  - Payments Service: orchestrates intents (pay-in, payout, swap) → tasks → settlement jobs with retries + DLQ.
  - Treasury Service: manages FX routing, liquidity thresholds, and sweep policies to stablecoins.
  - Compliance Service: KYC/KYB, sanctions, velocity rules, travel rule payloads for crypto legs.
  - Notifications: Slack/WhatsApp/email for approvals, failures, recovery nudges.
- **Data**
  - Audit log per hop (intent → authorization → capture → settlement).
  - Reconciliation: match connector references to ledger entries; auto mark/exception queue.

## Core Flows
1) **Pay-in (Fiat → Stablecoin)**
   - Collect via bank/mobile money connector.
   - Post ledger entry: `customer_fiat` -> `treasury_fiat`.
   - Swap: call ramp/DEX; post `treasury_fiat` -> `treasury_stablecoin`.
   - Fees posted to `revenue_fees`.
2) **Pay-out (Stablecoin → Fiat)**
   - Check balances + compliance.
   - Swap: `treasury_stablecoin` -> `treasury_fiat`.
   - Disburse via selected connector; post `treasury_fiat` -> `beneficiary_fiat`.
3) **Internal Transfer (Crypto Native)**
   - Wallet to wallet USDC transfer on-chain; off-chain mirror in ledger; webhook confirmation.
4) **WhatsApp Flows**
   - Session ties to wallet id; intents (payout, collect, approve) call payments service; approvals recorded in audit.

## Compliance & Risk
- KYB for businesses; KYC for end-users; doc + selfie checks.
- Sanctions/PEP screening per counterparty; velocity limits per wallet; device fingerprint for WhatsApp/USSD.
- Travel rule payload for stablecoin over set thresholds; proof-of-reserves report for treasury wallets.

## Observability & Safety
- Circuit breakers per connector; adaptive retries with backoff.
- Synthetic monitors on payout success rate, on-chain confirmation latency, FX slippage.
- Dead-letter queue review with auto-retry budget.

## Phased Backlog (actionable)
**Phase 0: Hardening (1-2 wks)**
- Add waitlist intake API (done) and ops view for prioritization.
- Surface live connector catalog on landing (done).

**Phase 1: Wallet Foundations (2-3 wks)**
- Introduce wallet tables (business/customer/treasury, balances per currency).
- Idempotent ledger postings; audit log service.
- AuthZ policies for payouts/approvals.

**Phase 2: Fiat Rails Integration (2-3 wks)**
- Wrap existing bank/mobile money connectors with intents → tasks pattern.
- Reconciliation job mapping connector references to ledger entries.
- Configure rate limits + circuit breakers per connector.

**Phase 3: Stablecoin Rail (3-4 wks)**
- USDC custody adapter (Solana first, EVM fallback); on/off-ramp integration.
- Swap service (quote + execute) with slippage guardrails.
- Treasury sweep policies to maintain float thresholds.

**Phase 4: Experiences (2-3 wks)**
- WhatsApp/USSD payout + approval flows wired to wallet service.
- Prebuilt workflows (cross-border payroll, vendor payouts, treasury sweeps) as reusable templates.
- Alerts to Slack/WhatsApp for failures and approvals.

## Validation Plan
- Contract tests per connector (sandbox keys) + replay tests against recorded fixtures.
- Simulated payouts with fake banks/mobile money plus on-chain devnet; no production keys required.
- Load tests on ledger postings and idempotency keys.
- Manual QA scripts for WhatsApp flows (happy path + recovery).

