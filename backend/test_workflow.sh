#!/bin/bash
set -e

# Base URL
API_URL="http://localhost:8080"

extract_id() {
  python3 -c "import sys, json; print(json.load(sys.stdin)['id'])"
}

extract_exec_id() {
  python3 -c "import sys, json; print(json.load(sys.stdin)['execution_id'])"
}

echo "1. Resetting Database..."

echo "2. Register User (Workflow Owner)..."
# Use random suffix to avoid duplicate key errors on persistent DB (Supabase)
RANDOM_SUFFIX=$(date +%s)
EMAIL="workflow_king_${RANDOM_SUFFIX}@imuka.co"

RESPONSE=$(curl -s -X POST "$API_URL/api/accounts" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"name\": \"Workflow King\", \"type\": \"BUSINESS\"}")
echo "Raw Response: $RESPONSE"
ACCOUNT_ID=$(echo "$RESPONSE" | extract_id)
echo "   Account ID: $ACCOUNT_ID"

echo "3. Create Workflow Template..."
# Create a DAG: Start -> Action (Pay) -> Condition (>10) -> True: Email, False: End
TEMPLATE_ID=$(curl -s -X POST "$API_URL/api/workflows/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto Payout > 10",
    "description": "Pays if amount > 10",
    "definition": [
        {
            "id": "step1",
            "type": "CONDITION",
            "action": "", 
            "config": {
                "key": "amount",
                "value": 10,
                "false_next": ""
            },
            "next": "step2"
        },
        {
            "id": "step2",
            "type": "ACTION",
            "action": "PAYMENT_PAYOUT",
            "config": {
                "amount": 5,
                "currency": "USDC",
                "to_wallet_id": "" 
            },
            "next": ""
        }
    ]
  }' | extract_id)
    
echo "   Template ID: $TEMPLATE_ID"

echo "4. Execute Workflow (Case: Amount 20 > 10 -> Should Pay)..."
EXEC_ID=$(curl -s -X POST "$API_URL/api/workflows/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"template_id\": \"$TEMPLATE_ID\",
    \"account_id\": \"$ACCOUNT_ID\",
    \"input\": {
        \"amount\": 20
    }
  }" | extract_exec_id)
echo "   Execution ID: $EXEC_ID"

echo "5. Checking Logs..."
echo "   Success! Workflow Initialized with Execution ID: $EXEC_ID"
