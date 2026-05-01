# Corridor MCP Workflow Examples

This document provides practical examples of AI-powered workflows using Corridor's MCP integration.

## Account Setup Workflows

### New Business Onboarding

**Prompt**: "Help me set up Corridor for my 25-person tech startup in Nigeria"

**AI Workflow**:
```
1. check_tier_limits
   → Analyzes current account tier and recommends Business tier

2. get_treasury_balance  
   → Checks initial funding status

3. create_goal (if needed)
   → "Initial Treasury Funding" goal for $10,000

4. list_employees
   → Sets up employee roster template

Response: "I've analyzed your needs and recommend the Business tier for 25 employees. 
Your account supports up to 100 employees and 10,000 transactions/month. 
I've created a treasury funding goal to reach your target balance."
```

### Multi-Currency Setup

**Prompt**: "Configure payments for our remote team across Kenya, Nigeria, and USA"

**AI Workflow**:
```
1. check_balance for each currency (KES, NGN, USD, USDC)
2. get_exchange_rate between currency pairs
3. Recommend optimal currency allocation
4. Set up automatic currency conversion rules

Response: "I've configured multi-currency support. Your team can receive payments in:
- Kenya: KES via M-Pesa integration
- Nigeria: NGN via bank transfer  
- USA: USD/USDC via ACH and crypto
Current exchange rates: 1 USD = 129 KES, 1 USD = 460 NGN"
```

## Payroll Automation

### Monthly Payroll Processing

**Prompt**: "Process payroll for January, accounting for EWA advances"

**AI Workflow**:
```
1. list_employees
   → Gets employee roster with EWA status

2. check_tier_limits
   → Verifies payroll processing capacity

3. get_treasury_balance
   → Confirms sufficient funds across currencies

4. Calculate net pay after EWA deductions
   → For each employee: gross_pay - ewa_advances

5. send_payment (batch)
   → Processes payments to all employees

6. export_transactions
   → Generates payroll report for accounting

Response: "January payroll processed for 25 employees. Total paid: $87,500 USD.
EWA advances deducted: $12,300. Remaining treasury balance: $156,200.
Payroll report exported to payroll_january_2024.csv"
```

### EWA Management

**Prompt**: "Show me which employees are eligible for wage advances this week"

**AI Workflow**:
```
1. list_employees
   → Gets employee roster with advance history

2. Analyze eligibility criteria:
   - Employment duration > 30 days
   - No outstanding advances > 50% of monthly salary
   - Good payment history

3. Calculate available advance amounts
   → Based on earned wages and company policy

Response: "12 employees are eligible for EWA advances:
- Alice Johnson: Up to $800 available (worked 18 days this month)
- Bob Smith: Up to $1,200 available (worked 22 days this month)
- ... 
Total potential advances: $9,400"
```

## Social Payment Workflows

### Team Event Fundraising

**Prompt**: "Organize collection for our team retreat to Mombasa, need $5,000 total"

**AI Workflow**:
```
1. create_goal
   → Title: "Team Retreat - Mombasa 2024"
   → Target: $5,000 USD
   → Description: "3-day team building retreat including accommodation and activities"

2. Calculate per-person contribution
   → $5,000 ÷ 25 people = $200 per person

3. Generate shareable link and QR code

4. Monitor contributions in real-time

Response: "Created 'Team Retreat - Mombasa 2024' fundraising goal for $5,000.
Each team member needs to contribute $200.
Share link: https://corridor.money/goals/team-retreat-mombasa-2024
QR code generated for easy mobile contributions."
```

### Group Purchase Management

**Prompt**: "Split the cost of new office furniture among the team leads"

**AI Workflow**:
```
1. create_split_payment
   → Title: "Office Furniture Purchase"
   → Total: $2,400
   → Participants: ["alice@company.com", "bob@company.com", "carol@company.com"]

2. Calculate equal split
   → $2,400 ÷ 3 = $800 per person

3. Send payment requests to participants

4. Track payment status

Response: "Created split payment for office furniture: $2,400 total.
Each team lead pays $800. Payment requests sent to:
- Alice Johnson: Pending
- Bob Smith: Paid ✓  
- Carol Davis: Pending"
```

## Financial Management

### Treasury Monitoring

**Prompt**: "Give me a daily treasury report with recommendations"

**AI Workflow**:
```
1. get_treasury_balance
   → Current balances across all currencies

2. export_transactions (last 24 hours)
   → Recent transaction activity

3. check_tier_limits
   → Usage against account limits

4. Analyze trends and generate recommendations

Response: "Daily Treasury Report - February 13, 2024

Current Balances:
- USD: $156,200 (↑2.3% from yesterday)
- USDC: $45,800 (↓1.1% from yesterday)  
- KES: 2,890,000 (stable)
- NGN: 18,450,000 (↑5.2% from yesterday)

24h Activity: 47 transactions, $23,400 total volume
Account Usage: 1,247/10,000 monthly transactions (12.5%)

Recommendations:
- Consider converting excess USD to USDC for better yield
- NGN balance growing - good for Nigeria team payments
- On track for monthly transaction limits"
```

### Expense Analysis

**Prompt**: "Analyze our Q1 spending patterns and suggest optimizations"

**AI Workflow**:
```
1. export_transactions
   → Q1 2024 transaction data

2. Categorize expenses:
   - Payroll: 78% ($234,000)
   - Office expenses: 12% ($36,000)
   - Software subscriptions: 7% ($21,000)
   - Travel: 3% ($9,000)

3. Compare to previous quarters

4. Identify optimization opportunities

Response: "Q1 2024 Spending Analysis

Total Expenses: $300,000 (↑8% vs Q4 2023)

Category Breakdown:
- Payroll: $234,000 (78%) - Normal growth with new hires
- Office: $36,000 (12%) - ↑15% due to furniture purchase
- Software: $21,000 (7%) - ↑25% from new tool subscriptions
- Travel: $9,000 (3%) - ↓40% vs Q4 (seasonal)

Optimization Opportunities:
1. Review software subscriptions - $3,200/month in unused licenses
2. Negotiate bulk office supply discounts - potential 15% savings
3. Consider remote work stipends vs office expenses"
```

## Invoice and Billing

### Automated Client Billing

**Prompt**: "Create invoices for all Q1 consulting clients based on tracked hours"

**AI Workflow**:
```
1. Analyze client database and time tracking data

2. For each client:
   - Calculate billable hours
   - Apply hourly rates
   - Add applicable taxes
   - create_invoice with details

3. Schedule follow-up reminders

Response: "Generated 12 client invoices for Q1 2024:

- TechCorp Inc: $15,600 (78 hours × $200/hr)
- StartupXYZ: $8,400 (42 hours × $200/hr)  
- Enterprise Co: $24,800 (124 hours × $200/hr)
...

Total Invoiced: $156,800
All invoices sent with 30-day payment terms
Automated follow-ups scheduled for day 15 and 25"
```

### Payment Collection

**Prompt**: "Follow up on overdue invoices and create payment plans if needed"

**AI Workflow**:
```
1. Identify overdue invoices (>30 days)

2. For each overdue invoice:
   - Send personalized follow-up
   - Offer payment plan options
   - Create goal for partial payments if needed

3. Track response rates and payment commitments

Response: "Overdue Invoice Follow-up Report

5 invoices overdue (>30 days): $43,200 total

Actions Taken:
- TechCorp Inc ($15,600): Payment plan created - 3 monthly installments
- StartupXYZ ($8,400): Responded - payment scheduled for next week
- Enterprise Co ($24,800): No response - escalated to collections
- ClientABC ($7,200): Partial payment received ($3,600)
- SmallBiz LLC ($2,800): Payment plan requested

Recovery Rate: 60% committed to payment"
```

## Advanced Automation

### Smart Budget Alerts

**Prompt**: "Set up intelligent budget monitoring with automatic alerts"

**AI Workflow**:
```
1. Analyze historical spending patterns

2. Set dynamic budget thresholds:
   - Payroll: Alert if >5% over monthly average
   - Office: Alert if >20% over monthly average
   - Software: Alert on any new subscriptions

3. Create automated monitoring workflow

Response: "Smart Budget Monitoring Activated

Dynamic Thresholds Set:
- Payroll: Alert if >$82,000/month (current avg: $78,000)
- Office: Alert if >$14,400/month (current avg: $12,000)
- Software: Alert on any expense >$500/month
- Travel: Alert if >$4,800/month (current avg: $4,000)

Monitoring Active: Real-time alerts via Slack and email
Historical Analysis: 6 months of data used for baselines"
```

### Compliance Automation

**Prompt**: "Ensure all payments comply with international transfer regulations"

**AI Workflow**:
```
1. For each international payment:
   - Check recipient country regulations
   - Verify KYC/AML requirements
   - Calculate tax implications

2. Flag high-risk transactions for review

3. Generate compliance reports

Response: "Compliance Check Complete

International Payments This Month: 23 transactions, $67,400 total

Compliance Status:
- Kenya (8 payments): ✓ All compliant, M-Pesa integration active
- Nigeria (12 payments): ✓ All compliant, bank transfer verified
- USA (3 payments): ✓ All compliant, ACH processing

Flagged for Review: 0 transactions
Next Compliance Report: March 1, 2024"
```

## Integration Examples

### Slack Bot Integration

**Prompt**: "Create a Slack bot that can handle basic Corridor operations"

**Bot Commands**:
```
/corridor balance USDC
→ Current USDC balance: $45,800

/corridor send alice@company.com 500 USD "Bonus payment"
→ Payment sent: $500 USD to Alice Johnson

/corridor goal "Team Lunch" 200 USD
→ Created goal: https://corridor.money/goals/team-lunch-xyz

/corridor employees
→ 25 employees, 12 eligible for EWA advances

/corridor treasury
→ Total treasury: $267,800 across 4 currencies
```

### Zapier Workflow

**Trigger**: New employee added to HR system
**Actions**:
```
1. Add employee to Corridor via list_employees endpoint
2. Send welcome email with EWA information
3. Create Slack channel invitation
4. Schedule 30-day EWA eligibility reminder
```

### n8n Financial Dashboard

**Workflow**: Daily financial summary
```
1. Every day at 9 AM
2. get_treasury_balance → Current balances
3. export_transactions (last 24h) → Recent activity  
4. check_tier_limits → Usage metrics
5. Generate summary report
6. Post to #finance Slack channel
7. Email to CFO and finance team
```

These examples demonstrate the power of combining AI with Corridor's MCP integration to create intelligent, automated financial workflows that save time and reduce errors while providing valuable insights into your business operations.