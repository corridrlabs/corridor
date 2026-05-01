# Circle/USDC-first payments architecture

## Goals
- Borderless rails: fiat ↔ USDC, crypto-to-fiat via stablecoins, local payout rails.
- Single wallet surface for treasury (USDC) and operating balances per currency.
- Deterministic reconciliation and observability for every hop.

## Components
- **Wallets**: `wallet` + `shadow_wallet` tables hold customer/business balances; `Payment` rows track provider status.
- **Providers**:
  - Circle: on/off ramp, treasury USDC wallets, FX, address management.
  - Local rails: Flutterwave/Paystack for cards/banks, M-Pesa for mobile money.
  - Notifications: Slack/Email/WhatsApp for status.
- **APIs**:
  - `/api/payments` (existing) for local rails; extend with Circle client.
  - `/api/transactions` now reads persisted `Payment` rows (no mocks).
  - `/api/waitlist` captures priority use cases.

## Flows
1) **On/Off-ramp USDC**
   - Create Circle wallet/address for business.
   - Webhook on funds received → credit `wallet` (USDC) and write `Payment` with provider_ref.
   - Optional auto-FX: convert via Circle to destination fiat, write conversion fees, update `shadow_wallet`.

2) **Borderless payroll**
   - Funding source: USDC wallet.
   - For each payee: choose rail (mobile money, bank, card). Convert via Circle if currency mismatch.
   - Persist `Payment` rows per payee; aggregate job record for idempotency; retries handled via `jobs/payment_recovery.py`.

3) **Collections with WhatsApp**
   - Generate payable link referencing invoice/payment_intent.
   - Deliver over WhatsApp template; on completion, webhook credits `wallet`, updates `Payment`, triggers reconciliation to ERP connector.

4) **Vendor payouts / treasury sweep**
   - Triggered via workflow builder or Slack approval.
   - If treasury in USDC, convert to destination currency just-in-time; record FX rate + fees on `Payment.raw`.

## Data model updates (next steps)
- Add `payment_intent` table to group attempts and hold expected amounts/currencies.
- Add `fx_rate` table for audit of conversions.
- Extend `wallet` with `asset_type` (fiat/usdc) and `available/hold` balances.

## Safety & observability
- Idempotency keys per transfer; retries logged in `payment_recovery`.
- Webhook signatures validated; drift detection by comparing provider balances to `wallet` sums.
- Alerts: Slack for failures, WhatsApp for customer-facing flows, email for finance summaries.

## APIs to expose (upcoming)
- `POST /api/payments/circle/deposit-address`
- `POST /api/payments/circle/payout` (USDC → {KES, NGN, USD} with rail selection)
- `POST /api/payments/quote` (returns FX + fees across Circle/local rails)
- `GET /api/wallets/{id}/balances` unified view across assets/providers.

