# Corridor Multichain Rails (ETH L2 + Solana)

## Design
- Custody: in-house generation of keys for Ethereum (Base/Arbitrum compatible) and Solana using `cryptography`. Keys are encrypted (Fernet) before being stored alongside wallet metadata.
- Ledger-first: deposits/withdrawals hit internal `business_wallets` and `wallet_transactions`. On-chain broadcast is delegated to a sweeper/worker using stored key material.
- Stablecoin bridge: conversions go through USD prices (via `price_oracle`) enabling fiat↔stablecoin↔crypto. Supported symbols: USD/KES/NGN, ETH, SOL, USDC, USDT.
- Rails abstraction: `_get_network_for_currency` maps currency to network; adapters live in `blockchain_service` with per-rail key generation.

## Flows
1) Deposit address generation  
   - `POST /api/treasury/wallets/{currency}/address`  
   - Generates and stores encrypted key + address in `metadata_info`; reuses existing address if present.

2) Wallet conversions  
   - `POST /api/treasury/convert` with `{from_currency, to_currency, amount}`.  
   - Uses live USD cross-rates; double-entry recorded via `wallet_transactions`.

3) Withdrawals  
   - `POST /api/treasury/withdraw` with `{currency, amount, address}`.  
   - Debits ledger, creates queued transaction with reference `internal-<uuid>`. Broadcasting should be handled by a background worker that signs using stored keys and updates status/reference upon chain confirmation.

4) WhatsApp-native payouts  
   - Combine `/api/treasury` endpoints with existing WhatsApp flows to onboard, KYC, and disburse without dashboard dependency.

## Operations
- Env vars: `ETH_RPC_URL`, `ETH_HOT_PRIVATE_KEY`, `SOLANA_RPC_URL`, `SOLANA_HOT_PRIVATE_KEY`, `KEY_ENCRYPTION_SECRET`.
- Rotate keys by generating a new wallet address per business currency; sweep funds to cold storage before rotation.
- Add a sweeper/relay that: 
  1) polls `wallet_transactions` with `status='queued'`,
  2) decrypts key, signs, broadcasts to the proper RPC,
  3) updates `reference` with chain hash and sets status to `completed` or `failed`.

## Testing
- Unit: mock `price_oracle` and ensure conversion ledger entries link both sides.
- Integration: call `/wallets/{currency}/address`, `/convert`, `/withdraw` and validate ledger balances and transaction status transitions.
- Security: require `KEY_ENCRYPTION_SECRET`; refuse to start broadcast workers if missing.

