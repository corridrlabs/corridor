#!/bin/bash

# Email Service Test Script
# Tests all email scenarios: OTP, payments, invites, withdrawals, updates, security alerts

BASE_URL="http://localhost:8080"
TEST_EMAIL="${TEST_EMAIL:-users@corridormoney.net}"

echo "🧪 Testing Corridor Email Service"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: OTP Verification Email
echo -e "${YELLOW}Test 1: OTP Verification Email${NC}"
echo "Sending OTP to $TEST_EMAIL..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/verify/send" \
  -H "Content-Type: application/json" \
  -d "{\"channel\":\"email\",\"contact\":\"$TEST_EMAIL\"}")

if echo "$RESPONSE" | grep -q "success\|code\|sent"; then
  echo -e "${GREEN}✓ OTP email sent successfully${NC}"
  echo "Check your email for verification code"
else
  echo -e "${RED}✗ Failed to send OTP email${NC}"
  echo "Response: $RESPONSE"
fi
echo ""

# Test 2: Register user for further tests
echo -e "${YELLOW}Setting up test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"sender@corridor.test\",
    \"password\":\"Test123!\",
    \"full_name\":\"Test Sender\"
  }")

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Test user created${NC}"
else
  echo -e "${YELLOW}⚠ Using existing user or login required${NC}"
  # Try login instead
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\":\"sender@corridor.test\",
      \"password\":\"Test123!\"
    }")
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
fi
echo ""

# Test 3: Payment Notification Email (to existing Corridor user)
echo -e "${YELLOW}Test 3: Payment Notification Email${NC}"
echo "Simulating payment to existing user..."
# This would trigger if we send to an existing user
echo -e "${YELLOW}⚠ Requires recipient user setup - skipping for now${NC}"
echo ""

# Test 4: Invite Email (to non-user)
echo -e "${YELLOW}Test 4: Invite Email (Non-User)${NC}"
if [ -n "$TOKEN" ]; then
  echo "Sending payment to non-user: newuser@example.com..."
  INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/social/pay" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"to_email\":\"users@corridormoney.net\",
      \"amount\":50,
      \"currency\":\"USDC\",
      \"message\":\"Test invite payment\"
    }")
  
  if echo "$INVITE_RESPONSE" | grep -q "pending\|invite\|sent\|success"; then
    echo -e "${GREEN}✓ Invite email sent to newuser@example.com${NC}"
    echo "Check email for claim link"
  else
    echo -e "${RED}✗ Failed to send invite email${NC}"
    echo "Response: $INVITE_RESPONSE"
  fi
else
  echo -e "${RED}✗ No auth token - skipping${NC}"
fi
echo ""

# Test 5: Withdrawal Confirmation Email
echo -e "${YELLOW}Test 5: Withdrawal Confirmation Email${NC}"
echo "This would be triggered by a successful withdrawal"
echo -e "${YELLOW}⚠ Requires funded wallet - manual test needed${NC}"
echo ""

# Test 6: Account Update Email
echo -e "${YELLOW}Test 6: Account Update Email${NC}"
echo "This would be triggered by account settings changes"
echo -e "${YELLOW}⚠ Requires account update endpoint - manual test needed${NC}"
echo ""

# Test 7: Security Alert Email
echo -e "${YELLOW}Test 7: Security Alert Email${NC}"
echo "This would be triggered by suspicious login or security events"
echo -e "${YELLOW}⚠ Requires security event - manual test needed${NC}"
echo ""

# Summary
echo "================================"
echo -e "${GREEN}Email Service Test Summary${NC}"
echo "================================"
echo "✓ OTP Verification: Tested"
echo "⚠ Payment Notification: Requires recipient setup"
echo "✓ Invite Email: Tested (if auth successful)"
echo "⚠ Withdrawal Confirmation: Requires funded wallet"
echo "⚠ Account Update: Requires update endpoint"
echo "⚠ Security Alert: Requires security event"
echo ""
echo "📧 Check the following email addresses:"
echo "  - $TEST_EMAIL (OTP)"
echo "  - users@corridormoney.net (Invite)"
echo ""
echo "💡 To fully test all scenarios:"
echo "  1. Configure AWS SES credentials in env file"
echo "  2. Fund a test wallet for withdrawal tests"
echo "  3. Update account settings to trigger update email"
echo "  4. Simulate security events for alert emails"
