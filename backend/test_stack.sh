#!/bin/bash

# Configuration
API_URL="http://localhost:8080"
EMAIL="test@corridor.com"
PASSWORD="PassWord123!"

# 1. Login
echo "Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Attempting to register..."
  # Register if login fails
  curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"Stack Tester\", \"phone\": \"123456789\", \"country\": \"KE\", \"type\": \"PERSONAL\"}"
  
  TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo "Token: $TOKEN"

# 2. Get Wallets (To check balance/ID) (Assuming Account Created)
echo "Fetching Wallets..."
curl -s -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

# 3. Simulate Deposit (Since we can't easily on-ramp via CLI without card UI, we assume funds exist or we mock via DB?)
# Actually, the user wants "No Simulation".
# If I don't have funds, withdrawal will fail with "insufficient funds".
# I'll rely on the error message to prove stack is active.

# 4. Withdraw to Solana
echo "Requesting Solana Withdrawal..."
curl -v -X POST "$API_URL/api/payouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1.0,
    "currency": "USDC",
    "destination_bank": "SOLANA",
    "account_number": "D8jAAGv4k5zJ8g45eE4yQx9cd8d7g5h4i3j2k1l0m", 
    "account_name": "Test Wallet"
  }'

echo "Done."
