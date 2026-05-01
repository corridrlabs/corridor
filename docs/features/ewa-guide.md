# EWA (Earned Wage Access) Setup Guide

## Overview

Corridor's EWA system allows employees to access their earned wages before corridor, providing financial flexibility and reducing financial stress. This guide covers setup, configuration, and integration with existing HR/payroll systems.

## Quick Start

### 1. Enable EWA for Your Organization

```bash
# Set advance limit (percentage of earned wages)
curl -X POST /api/ewa/advance-limit \
  -H "Content-Type: application/json" \
  -d '{"org_id": "your-org", "advance_limit": 50.0}'
```

### 2. Import Employee Data

**Option A: CSV Upload**
1. Download the employee template from the admin dashboard
2. Fill in employee data (external_id, name, email, hourly_rate)
3. Upload via `/ewa/import` page

**Option B: API Import**
```bash
curl -X POST /api/ewa/admin/upload-employees \
  -H "X-Org-ID: your-org" \
  -F "csv=@employees.csv"
```

### 3. Configure Pay Periods

Set up your payroll schedule to ensure proper repayment tracking:

```sql
INSERT INTO ewa.payroll_periods (org_id, start_date, end_date, pay_date) 
VALUES ('your-org', '2024-01-01', '2024-01-07', '2024-01-12');
```

## ERP System Integration

### Supported Systems

- **Workday** - Enterprise HR platform
- **BambooHR** - SMB HR management
- **SAP SuccessFactors** - Enterprise cloud HR
- **ADP** - Payroll and HR services

### Integration Methods

#### 1. OAuth Connection (Recommended)

Navigate to `/ewa/integrations` and connect your ERP system:

1. Click "Connect" for your ERP system
2. Authorize Corridor to access employee data
3. Configure sync settings

#### 2. Webhook Setup (Manual)

If OAuth isn't available, configure webhooks in your ERP system:

**Workday Webhook URL:**
```
https://your-domain.com/api/ewa/webhooks/workday
```

**Required Events:**
- `employee_updated` - When employee data changes
- `attendance_updated` - When time is tracked
- `payroll_processed` - When payroll runs

**Webhook Payload Example:**
```json
{
  "event_type": "attendance_updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "attendance": [
    {
      "employee_id": "EMP001",
      "date": "2024-01-15",
      "hours_worked": 8.0
    }
  ]
}
```

#### 3. API Integration

For custom integrations, use our ERP adapter framework:

```go
// Example: Custom ERP adapter
type CustomERPAdapter struct {
    apiKey  string
    baseURL string
}

func (c *CustomERPAdapter) SyncEmployees(orgID string) error {
    // Fetch employees from your ERP
    employees := fetchEmployeesFromERP()
    
    // Convert to Corridor format
    for _, emp := range employees {
        corridorEmployee := Employee{
            ExternalID: emp.ID,
            Name:       emp.FullName,
            Email:      emp.WorkEmail,
            HourlyRate: emp.PayRate,
        }
        // Save to Corridor
    }
    return nil
}
```

## Employee Onboarding

### Bank Account Verification

Before employees can request advances, they must verify their bank account:

```javascript
// Frontend: Bank verification
const verifyBank = async (accountNumber, routingNumber) => {
  const response = await fetch('/api/ewa/employee/verify-bank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: 'current',
      account_number: accountNumber,
      routing_number: routingNumber
    })
  });
  return response.json();
};
```

### Setting Advance Limits

Configure per-employee or organization-wide limits:

```sql
-- Organization-wide limit (50% of earned wages)
UPDATE ewa.org_settings 
SET advance_limit = 50.0 
WHERE org_id = 'your-org';

-- Individual employee limit (override)
ALTER TABLE ewa.employees ADD COLUMN individual_limit DECIMAL(5,2);
UPDATE ewa.employees 
SET individual_limit = 75.0 
WHERE id = 'high-performer-employee';
```

## Advance Request Flow

### 1. Employee Requests Advance

```javascript
const requestAdvance = async (amount) => {
  const response = await fetch('/api/ewa/employee/request-advance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: 'current',
      amount: amount
    })
  });
  return response.json();
};
```

### 2. System Validates Request

- Check earned amount vs. requested amount
- Verify advance limit compliance
- Ensure bank account is verified
- Check for existing outstanding advances

### 3. Advance Disbursement

Advances are automatically disbursed via:
- ACH transfer to verified bank account
- Instant payment via Circle/USDC
- Integration with existing payroll system

### 4. Repayment on Corridor

```sql
-- Automatic repayment processing
UPDATE ewa.advances 
SET status = 'repaid', repaid_at = CURRENT_TIMESTAMP 
WHERE employee_id IN (
  SELECT employee_id FROM payroll_processed_today
) AND status = 'disbursed';
```

## Configuration Options

### Advance Limits

```javascript
// Set different limits by employee tier
const advanceLimits = {
  'entry_level': 25.0,    // 25% of earned wages
  'experienced': 50.0,    // 50% of earned wages
  'senior': 75.0          // 75% of earned wages
};
```

### Pay Frequencies

```sql
-- Configure pay frequency
UPDATE ewa.org_settings 
SET pay_frequency = 'biweekly' 
WHERE org_id = 'your-org';
```

Supported frequencies:
- `weekly` - Every 7 days
- `biweekly` - Every 14 days  
- `monthly` - Once per month
- `custom` - Custom schedule

### Fee Structure

```sql
-- Optional: Add fee structure
ALTER TABLE ewa.org_settings ADD COLUMN fee_structure JSONB;

UPDATE ewa.org_settings 
SET fee_structure = '{
  "flat_fee": 2.99,
  "percentage_fee": 0.0,
  "max_fee": 5.00
}'::jsonb
WHERE org_id = 'your-org';
```

## Monitoring & Analytics

### Dashboard Metrics

Access real-time EWA metrics at `/ewa/dashboard`:

- Total employees enrolled
- Active advances
- Total amount advanced
- Repayment rate
- Average advance amount

### Reporting

Generate detailed reports:

```bash
# Export monthly EWA report
curl "/api/ewa/export?org_id=your-org&start_date=2024-01-01&end_date=2024-01-31" \
  -o ewa_report_january.csv
```

### Compliance Tracking

Monitor compliance with labor laws:

```sql
-- Track advance frequency per employee
SELECT 
  e.name,
  COUNT(a.id) as advance_count,
  AVG(a.amount) as avg_advance,
  MAX(a.requested_at) as last_advance
FROM ewa.employees e
LEFT JOIN ewa.advances a ON e.id = a.employee_id
WHERE a.requested_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.id, e.name;
```

## Security & Compliance

### Data Protection

- All employee data encrypted at rest
- PCI DSS compliance for payment processing
- SOC 2 Type II certified infrastructure
- GDPR compliant data handling

### Audit Trail

Every EWA transaction is logged:

```sql
-- Audit trail for advances
SELECT 
  a.id,
  e.name,
  a.amount,
  a.status,
  a.requested_at,
  a.repaid_at
FROM ewa.advances a
JOIN ewa.employees e ON a.employee_id = e.id
WHERE a.requested_at >= '2024-01-01'
ORDER BY a.requested_at DESC;
```

### Regulatory Compliance

- State-by-state wage access law compliance
- Automatic fee calculation and disclosure
- Consumer protection compliance
- Fair lending practice adherence

## Troubleshooting

### Common Issues

**1. Employee can't request advance**
- Check bank verification status
- Verify earned amount calculation
- Check advance limit settings

**2. ERP sync not working**
- Verify webhook URL configuration
- Check API credentials
- Review error logs in ERP system

**3. Repayment not processing**
- Confirm payroll period setup
- Check employee payroll status
- Verify advance status

### Support

For technical support:
- Email: jamesthaura51@gmail.com
- Documentation: https://docs.corridor.com/ewa
- Status page: https://status.corridor.com

## API Reference

### Endpoints

```
GET    /api/ewa/employee/earnings        # Get earned amount
POST   /api/ewa/employee/request-advance # Request advance
GET    /api/ewa/employee/history         # Advance history
POST   /api/ewa/admin/upload-employees   # Bulk employee import
GET    /api/ewa/dashboard                # Admin dashboard
POST   /api/ewa/webhooks/{system}        # ERP webhooks
```

### Rate Limits

- Employee endpoints: 100 requests/hour
- Admin endpoints: 1000 requests/hour
- Webhook endpoints: No limit

### Authentication

All endpoints require authentication via:
- JWT token (employees)
- API key (admin/integrations)
- Webhook signature (ERP systems)