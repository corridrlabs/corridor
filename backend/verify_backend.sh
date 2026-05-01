#!/bin/bash

# Corridor Backend Verification Script (Authenticated)
# This script tests the core API endpoints to ensure real logic is working.

BASE_URL="http://localhost:10000"
echo "--- Starting Corridor Backend Verification ($BASE_URL) ---"

# Helper to format output
format_output() {
    if command -v jq >/dev/null 2>&1; then
        jq .
    else
        cat
    fi
}

# 1. Register User
echo "[1] Registering New User..."
REG_RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
        "email": "test_user_'$(date +%s)'@corridor.money",
        "name": "Test User",
        "type": "PERSONAL",
        "password": "password123",
        "phone": "+254700000000",
        "country": "KE"
     }')
echo $REG_RESP | format_output

# 2. Login
echo -e "\n[2] Logging In..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
        "email": "test_user_'$(date +%s)'@corridor.money",
        "password": "password123"
     }')
# Note: Since I changed email in registration, I should use a fixed one for login or parse it.
# For simplicity, I'll use a fixed email for registration and login in this test.

echo -e "\n[2] Login Attempt (Fixed Email)..."
FIXED_EMAIL="tester_$(date +%s)@example.com"
curl -s -X POST "$BASE_URL/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
        "email": "'$FIXED_EMAIL'",
        "name": "Tester",
        "type": "PERSONAL",
        "password": "password123",
        "phone": "+254888888888",
        "country": "KE"
     }' > /dev/null

LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
        "email": "'$FIXED_EMAIL'",
        "password": "password123"
     }')

TOKEN=$(echo $LOGIN_RESP | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then
    echo "ERROR: Failed to acquire token. Login Response: $LOGIN_RESP"
    exit 1
fi
echo "Token Acquired: ${TOKEN:0:10}..."

# 3. Check User Existence (Real Logic)
echo -e "\n[3] Testing User Existence Check..."
curl -s -X POST "$BASE_URL/api/auth/check" \
     -H "Content-Type: application/json" \
     -d '{"email": "'$FIXED_EMAIL'", "phone": "+254888888888"}' | format_output

# 4. Send Verification Code (OTP)
echo -e "\n[4] Testing OTP Send (Check server logs for code)..."
curl -s -X POST "$BASE_URL/api/auth/verify/send" \
     -H "Content-Type: application/json" \
     -d '{"channel": "email", "contact": "'$FIXED_EMAIL'"}' | format_output

# 5. Get Solana Deposit Info (Authenticated)
echo -e "\n[5] Testing Solana Deposit Info..."
curl -s -X GET "$BASE_URL/api/onramp/solana" \
     -H "Authorization: Bearer $TOKEN" | format_output

# 6. Create Circle Payment Intent (Authenticated)
echo -e "\n[6] Testing Circle Payment Intent..."
curl -s -X POST "$BASE_URL/api/onramp/circle" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount": 50.0, "currency": "USD"}' | format_output

# 7. Get Wallets (Authenticated)
echo -e "\n[7] Testing Get Wallets..."
curl -s -X GET "$BASE_URL/api/wallets" \
     -H "Authorization: Bearer $TOKEN" | format_output

echo -e "\n--- Verification Complete ---"
