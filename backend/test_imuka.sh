#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "=== 0. Reset Database ==="
psql -U postgres -d corridor_v2 -c "TRUNCATE accounts, wallets, transactions, ledger_entries CASCADE;" > /dev/null

echo "=== 1. Register Imuka (Business Account) ==="
IMUKA_RESP=$(curl -s -X POST $BASE_URL/accounts -d '{"email": "admin@imuka.co", "name": "Imuka Inc.", "type": "BUSINESS"}')
IMUKA_ID=$(echo $IMUKA_RESP | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Imuka ID: $IMUKA_ID"

echo -e "\n=== 2. Register Expert User (Personal Account) ==="
EXPERT_RESP=$(curl -s -X POST $BASE_URL/accounts -d '{"email": "expert@gmail.com", "name": "Dr. Expert", "type": "PERSONAL"}')
EXPERT_ID=$(echo $EXPERT_RESP | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Expert ID: $EXPERT_ID"

echo -e "\n=== 3. Get Imuka Wallets (Invisible Blockchain) ==="
WALLETS_RESP=$(curl -s "$BASE_URL/wallets?account_id=$IMUKA_ID")
# Extract USDC Wallet ID
IMUKA_WALLET_ID=$(echo $WALLETS_RESP | python3 -c "import sys, json; print([w['id'] for w in json.load(sys.stdin) if w['currency'] == 'USDC'][0])")
# Extract KES Wallet ID
IMUKA_KES_ID=$(echo $WALLETS_RESP | python3 -c "import sys, json; print([w['id'] for w in json.load(sys.stdin) if w['currency'] == 'KES'][0])")
echo "Imuka USDC Wallet: $IMUKA_WALLET_ID"

echo -e "\n=== 4. Fund Imuka Wallet (Mock Deposit on Polygon) ==="
# Direct SQL injection for test since we don't have a deposit endpoint yet
psql -U postgres -d corridor_v2 -c "UPDATE wallets SET balance = 5000 WHERE id = '$IMUKA_WALLET_ID';" > /dev/null
echo "Deposited 5000 USDC into Imuka's Wallet"

echo -e "\n=== 5. Get Expert Wallet ==="
EXPERT_WALLETS=$(curl -s "$BASE_URL/wallets?account_id=$EXPERT_ID")
EXPERT_WALLET_ID=$(echo $EXPERT_WALLETS | python3 -c "import sys, json; print([w['id'] for w in json.load(sys.stdin) if w['currency'] == 'USDC'][0])")
echo "Expert USDC Wallet: $EXPERT_WALLET_ID"

echo -e "\n=== 6. Execute Social Payment (Expert Consulation Payout) ==="
PAY_RESP=$(curl -s -X POST $BASE_URL/social/pay -d "{\"from_wallet\": \"$IMUKA_WALLET_ID\", \"to_wallet\": \"$EXPERT_WALLET_ID\", \"amount\": 150, \"message\": \"Consultation Session #42\"}")
echo "Payment Result: $PAY_RESP"

echo -e "\n=== 7. Verify Social Feed ==="
curl -s $BASE_URL/social/feed | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))"
