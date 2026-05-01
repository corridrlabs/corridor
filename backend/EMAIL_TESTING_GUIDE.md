# Email Service Testing Guide

## Overview
This guide explains how to test the Corridor email service for all scenarios.

## Prerequisites

### 1. Configure AWS SES Credentials
Add these to your `env` file:

```bash
# AWS SES Configuration for Email Service
SES_ACCESS_KEY_ID=AKIA5FTZCNYSD7NKHJWN
SES_SECRET_ACCESS_KEY=BH48QXeAbqgkyviM5As/EmzRblYFHGalUzGbr5HA4TzL
SES_REGION=us-east-1
SES_FROM=people@corridormoney.net
```

**Prerequisites for AWS SES:**
1. **Verify Domain or Email Address**: In the AWS SES console, verify your sending domain (corridormoney.net) or email address
2. **Production Access**: Request production access to send emails to any recipient (outside of sandbox)
3. **IAM User**: Create an IAM user with SES permissions (ses:SendEmail)
4. **DNS Records**: Configure SPF/DKIM/DMARC records for better deliverability

**For Testing:**
- If still in sandbox, both sender and recipient must be verified identities
- Check AWS console for sending statistics and bounce rates

### 2. Restart Backend
```bash
cd backend
pkill -f "go run ./cmd/api"
go run ./cmd/api
```

---

## Testing Methods

### Method 1: Automated Test Script (Bash)
```bash
cd backend
chmod +x test_email_service.sh
./test_email_service.sh
```

**Tests:**
- ✅ OTP verification email
- ✅ Invite email for non-users
- ⚠️ Payment notification (requires recipient setup)
- ⚠️ Withdrawal confirmation (requires funded wallet)

### Method 2: Standalone Go Program
```bash
cd backend
go run test_email_main.go
```

**Tests all scenarios:**
- OTP verification
- Payment notification
- Invite to claim
- Withdrawal confirmation
- Account update
- Security alert
- Welcome email

### Method 3: Manual API Testing

#### Test OTP Email
```bash
curl -X POST http://localhost:8080/api/auth/verify/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"email","contact":"your-email@example.com"}'
```

#### Test Invite Email (Non-User Transfer)
```bash
# First, login to get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Send payment to non-user
curl -X POST http://localhost:8080/api/social/pay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_email":"newuser@example.com",
    "amount":50,
    "currency":"USDC",
    "message":"Test invite"
  }'
```

---

## Email Templates Preview

### 1. OTP Verification
- **Subject**: Your Corridor Verification Code - {code}
- **Features**: Large code display, 10-minute expiration notice
- **Design**: Blue gradient header, centered code box

### 2. Payment Received
- **Subject**: You received {currency} {amount} from {sender}
- **Features**: Amount display, sender name, dashboard link
- **Design**: Blue gradient header with 💸 emoji

### 3. Invite to Claim
- **Subject**: {sender} sent you {currency} {amount} - Claim Now
- **Features**: Claim button, Corridor benefits, amount display
- **Design**: Blue gradient header with 🎁 emoji

### 4. Withdrawal Confirmation
- **Subject**: Withdrawal of {currency} {amount} to {destination} Confirmed
- **Features**: Destination details, transaction link
- **Design**: Blue gradient header with ✅ emoji

### 5. Account Update
- **Subject**: Your Corridor Account Settings Updated
- **Features**: Change description, review settings link
- **Design**: Blue gradient header with ⚙️ emoji

### 6. Security Alert
- **Subject**: Security Alert: {alert_type}
- **Features**: Alert details, secure account button
- **Design**: Red gradient header with 🔒 emoji

### 7. Welcome Email
- **Subject**: Welcome to Corridor - Your Borderless Payment Platform
- **Features**: Platform benefits, get started button
- **Design**: Blue gradient header with 🚀 emoji

---

## Troubleshooting

### Emails Not Sending

**Check 1: AWS SES Configuration**
```bash
# Verify env file has SES settings
grep SES env
```

**Check 2: Backend Logs**
```bash
# Look for email service initialization
# Should see: "Email service initialized" or similar
```

**Check 3: Test AWS Credentials**
```bash
# Test AWS credentials (requires AWS CLI)
aws ses get-send-quota --region us-east-1
```

### Common Issues

**1. "InvalidClientTokenId / SignatureDoesNotMatch"**
- Solution: Verify AWS credentials (Access Key ID and Secret Access Key)
- Check IAM user has proper SES permissions

**2. "MessageRejected"**
- Solution: Verify sender identity is confirmed in SES
- Check if account is still in sandbox mode
- Ensure recipient is verified (if in sandbox)

**3. "Email service not configured"**
- Solution: Restart backend after adding SES config
- Verify AWS credentials are loaded (check logs)

**4. Emails in Spam**
- Solution: Configure SPF/DKIM/DMARC records for your domain
- Warm up your sending reputation gradually
- Monitor bounce and complaint rates in AWS console

---

## Production Checklist

- [ ] Configure production AWS SES credentials
- [ ] Set up SPF/DKIM/DMARC records
- [ ] Test all email scenarios
- [ ] Verify email deliverability
- [ ] Monitor email sending errors
- [ ] Set up email rate limiting
- [ ] Configure bounce handling
- [ ] Add unsubscribe links (for marketing emails)

---

## Email Service Status

**Current Implementation:**
- ✅ All 7 email types implemented
- ✅ Beautiful HTML templates with Corridor branding
- ✅ Descriptive, contextual subjects
- ✅ Integrated into core service
- ✅ Used in OTP verification
- ✅ Used in invite flow
- ✅ Migrated from SMTP to AWS SES
- ✅ AWS SDK v2 integration
- ⚠️ AWS SES credentials need configuration

**Next Steps:**
1. Configure SMTP credentials in production
2. Test email deliverability
3. Monitor email sending metrics
4. Add email analytics (open rates, click rates)
