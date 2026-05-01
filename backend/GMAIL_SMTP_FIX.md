# Gmail SMTP Authentication Fix

## Problem
Email sending failed with error:
```
535 5.7.8 Username and Password not accepted
```

## Root Cause
Gmail requires an **App Password** for SMTP authentication, not your regular Gmail password.

## Solution

### Step 1: Generate Gmail App Password
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Enable **2-Step Verification** (if not already enabled)
4. After 2FA is enabled, go back to Security
5. Click on **App passwords** (under "How you sign in to Google")
6. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Enter "Corridor Backend"
7. Click **Generate**
8. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update env File
Replace the SMTP_PASSWORD in your `env` file with the app password:

```bash
SMTP_PASSWORD=abcdefghijklmnop  # Remove spaces from the app password
```

### Step 3: Restart Backend
```bash
cd backend
pkill -f "go run ./cmd/api"
go run ./cmd/api
```

### Step 4: Test Again
```bash
curl -X POST http://localhost:8080/api/auth/verify/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"email","contact":"jamesmweni52@gmail.com"}'
```

## Alternative: Use Different SMTP Provider

If you don't want to use Gmail, here are alternatives:

### SendGrid (Recommended for Production)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=people@corridormoney.net
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your_mailgun_password
SMTP_FROM=people@corridormoney.net
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
SMTP_FROM=people@corridormoney.net
```

## Current Status
- ✅ Email service fully implemented with beautiful templates
- ✅ SMTP configuration loaded correctly
- ❌ Gmail authentication failing (needs App Password)
- 🔄 Waiting for correct App Password to test email delivery
