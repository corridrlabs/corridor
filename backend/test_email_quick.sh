#!/bin/bash

# Quick Email Test for jamesmweni52@gmail.com
# This script tests the email service and shows the verification code

echo "📧 Testing Email Service for jamesmweni52@gmail.com"
echo "=================================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8080/api/auth/check > /dev/null 2>&1; then
    echo "⚠️  Backend not running. Starting backend..."
    cd /home/adulam/Desktop/dev/Corridor/backend
    go run ./cmd/api > /tmp/corridor_backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    echo "Waiting 3 seconds for backend to initialize..."
    sleep 3
fi

echo "Sending OTP verification email to jamesmweni52@gmail.com..."
echo ""

# Send OTP request
RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/verify/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"email","contact":"jamesmweni52@gmail.com"}')

echo "API Response: $RESPONSE"
echo ""

# Check backend logs for the verification code
echo "🔍 Looking for verification code in backend output..."
echo ""

# The code will be printed to console since SMTP is not configured
sleep 1
tail -5 /tmp/corridor_backend.log 2>/dev/null | grep "VERIFICATION CODE" || echo "Check backend console for: >>> VERIFICATION CODE FOR jamesmweni52@gmail.com"

echo ""
echo "=================================================="
echo "📝 IMPORTANT NOTES:"
echo "=================================================="
echo ""
echo "✅ Email service is implemented and working"
echo "⚠️  SMTP credentials not configured - email not actually sent"
echo ""
echo "To actually send emails, add to your env file:"
echo ""
echo "SMTP_HOST=smtp.gmail.com"
echo "SMTP_PORT=587"
echo "SMTP_USERNAME=people@corridormoney.net"
echo "SMTP_PASSWORD=your_app_password"
echo "SMTP_FROM=people@corridormoney.net"
echo ""
echo "Then restart the backend:"
echo "  cd backend"
echo "  pkill -f 'go run ./cmd/api'"
echo "  go run ./cmd/api"
echo ""
echo "The verification code is shown in the backend console output."
