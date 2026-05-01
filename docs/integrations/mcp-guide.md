# AI-Powered Financial Operations with MCP

**Transform your financial workflows with AI agents that understand your business**

Corridor's Model Context Protocol (MCP) integration enables AI assistants to perform financial operations, automate business processes, and provide intelligent insights into your account data. This guide shows how agents connect to Corridor in practice.

## How Agents Connect

Agents connect to Corridor MCP in one of two ways:

1. **Local stdio MCP** for desktop clients such as Claude Desktop or Cursor.
2. **Remote HTTP JSON-RPC** for hosted agents, internal automations, or custom apps.

### Local stdio mode

```bash
cd mcp
PAYDAY_API_URL=https://payday-kqgb.onrender.com \
PAYDAY_API_KEY=pk_your_corridor_api_key \
go run ./cmd
```

### Remote HTTP mode

```bash
cd mcp
PAYDAY_API_URL=https://payday-kqgb.onrender.com \
PAYDAY_API_KEY=pk_your_corridor_api_key \
go run ./cmd/http
```

Then call:

- `POST /mcp/messages` for JSON-RPC requests
- `GET /health` for a health check
- `GET /` for service metadata

### JSON-RPC flow

1. Send `initialize`
2. Call `tools/list`
3. Call `tools/call` with a tool name and arguments
4. Use `resources/list` and `resources/read` for read-only data

Example:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"exchange_rate_get","arguments":{"from_currency":"USD","to_currency":"KES"}}}
```

### Authentication

- Account-scoped tools require a valid Corridor API key.
- Create keys from the Corridor app after legal consent has been accepted.
- Public read-only routes such as exchange rates can still work without a user session, but the MCP process still expects a non-empty `PAYDAY_API_KEY`.

## AI-Powered Account Setup

### Intelligent Onboarding
AI agents can guide new users through account setup with contextual recommendations:

```
User: "Set up Corridor for my 50-person startup in Kenya"

AI Response:
1. Checking tier limits for your account size...
2. Recommending Business tier for 50+ employees
3. Setting up KES as primary currency with USD backup
4. Configuring M-Pesa integration for local payments
5. Creating employee roster template for EWA enrollment
```

### Smart Configuration
AI automatically configures optimal settings based on your business profile:

- **Currency Selection**: Analyzes your location and business type
- **Payment Rails**: Recommends optimal payment methods for your region
- **Tier Selection**: Calculates usage needs and suggests appropriate tier
- **Security Settings**: Applies industry best practices automatically

## Automated Financial Operations

### Intelligent Payroll Processing

```
User: "Process payroll for this month, accounting for EWA advances"

AI Workflow:
1. list_employees → Get current employee roster
2. check_tier_limits → Verify payroll capacity
3. get_treasury_balance → Confirm sufficient funds
4. Calculate net pay after EWA deductions
5. Execute batch payments with send_payment
6. export_transactions → Generate payroll report
```

### Smart Expense Management

```
User: "The team wants to order lunch, collect $200 from everyone"

AI Workflow:
1. create_goal → Set up "Team Lunch" crowdfunding
2. Auto-calculate per-person contribution
3. Send goal link to team members
4. Monitor contributions in real-time
5. Process final payment to restaurant
```

### Automated Invoice Processing

```
User: "Create invoices for all Q1 consulting clients"

AI Workflow:
1. Analyze client database
2. Calculate billable hours per client
3. create_invoice for each client
4. Apply appropriate tax rates
5. Schedule automated follow-ups
```

## Integration with Business Tools

### n8n Workflow Automation

Connect Corridor MCP to n8n for advanced workflow automation:

```json
{
  "nodes": [
    {
      "name": "Corridor MCP",
      "type": "n8n-nodes-corridor-mcp",
      "parameters": {
        "operation": "check_balance",
        "currency": "USDC"
      }
    },
    {
      "name": "Slack Notification",
      "type": "n8n-nodes-slack",
      "parameters": {
        "message": "Treasury balance: {{$node['Corridor MCP'].json.balance}} USDC"
      }
    }
  ]
}
```

### Zapier Alternative Workflows

Create custom automation workflows:

1. **Daily Treasury Report**
   - Trigger: Daily at 9 AM
   - Action: get_treasury_balance → Send email summary

2. **Low Balance Alert**
   - Trigger: Balance below threshold
   - Action: Send Slack notification → Create funding goal

3. **Payroll Automation**
   - Trigger: Last day of month
   - Action: Process payroll → Export reports → Notify accounting

### Custom Business Logic

Build intelligent financial rules:

```python
# Example: Smart expense approval
def smart_expense_approval(expense_request):
    # Check budget limits
    limits = corridor_mcp.check_tier_limits()
    
    # Analyze spending patterns
    transactions = corridor_mcp.export_transactions(
        start_date="2024-01-01",
        end_date="2024-01-31"
    )
    
    # AI decision making
    if expense_request.amount > limits.monthly_budget * 0.1:
        return "requires_approval"
    elif is_recurring_vendor(expense_request.vendor):
        return "auto_approve"
    else:
        return "review_needed"
```

## Advanced AI Workflows

### Predictive Cash Flow Management

```
User: "Predict our cash flow for next quarter"

AI Analysis:
1. export_transactions → Historical spending patterns
2. list_employees → Payroll obligations
3. get_treasury_balance → Current reserves
4. Analyze seasonal trends
5. Generate cash flow forecast with recommendations
```

### Intelligent Fraud Detection

```
AI Monitoring:
1. Continuously monitor transaction patterns
2. Flag unusual spending behaviors
3. Cross-reference with employee schedules
4. Alert on suspicious activities
5. Automatically freeze accounts if needed
```

### Smart Budget Optimization

```
User: "Optimize our monthly budget allocation"

AI Recommendations:
1. Analyze spending categories
2. Identify cost-saving opportunities
3. Suggest budget reallocation
4. Predict ROI of budget changes
5. Implement approved optimizations
```

## Security Best Practices

### API Key Security

**Environment-Based Configuration**
```bash
# Production
export PAYDAY_API_KEY="prod_key_here"
export PAYDAY_API_URL="https://api.corridormoney.net"

# Development
export PAYDAY_API_KEY="dev_key_here"
export PAYDAY_API_URL="http://localhost:8000"
```

**Key Rotation Strategy**
- Rotate API keys monthly
- Use separate keys for different environments
- Monitor key usage in Corridor dashboard
- Implement automatic key rotation

### Access Control

**Role-Based Permissions**
```json
{
  "api_keys": {
    "payroll_bot": {
      "permissions": ["send_payment", "list_employees", "export_transactions"],
      "rate_limit": "1000/hour"
    },
    "treasury_monitor": {
      "permissions": ["check_balance", "get_treasury_balance"],
      "rate_limit": "100/hour"
    }
  }
}
```

**Audit Logging**
- Log all MCP tool executions
- Track API key usage patterns
- Monitor for unusual activity
- Maintain compliance records

### Network Security

**Secure Communication**
- Always use HTTPS for API calls
- Implement certificate pinning
- Use VPN for sensitive operations
- Enable IP whitelisting when possible

## Rate Limiting Considerations

### Understanding Limits

Corridor API implements tiered rate limiting:

- **Starter**: 100 requests/hour
- **Business**: 1,000 requests/hour  
- **Enterprise**: 10,000 requests/hour

### Optimization Strategies

**Batch Operations**
```python
# Instead of multiple individual calls
for employee in employees:
    send_payment(employee.email, employee.salary)

# Use batch processing
batch_payments = [
    {"email": emp.email, "amount": emp.salary}
    for emp in employees
]
process_batch_payments(batch_payments)
```

**Intelligent Caching**
```python
# Cache frequently accessed data
@cache(ttl=300)  # 5 minute cache
def get_exchange_rates():
    return corridor_mcp.get_exchange_rate("USD", "KES")
```

**Request Prioritization**
- Critical operations (payroll) get priority
- Background tasks use lower priority queues
- Implement exponential backoff for retries

## Monitoring and Analytics

### Real-Time Dashboards

Create AI-powered dashboards that automatically update:

```python
def create_financial_dashboard():
    # Real-time treasury balance
    treasury = corridor_mcp.get_treasury_balance()
    
    # Recent transaction trends
    transactions = corridor_mcp.export_transactions(
        start_date=last_30_days(),
        end_date=today()
    )
    
    # Employee advance status
    employees = corridor_mcp.list_employees()
    
    # Generate insights
    insights = ai_analyze_financial_data(
        treasury, transactions, employees
    )
    
    return create_dashboard(insights)
```

### Automated Reporting

**Weekly Financial Summary**
```python
def weekly_financial_report():
    # Gather data
    balances = corridor_mcp.get_treasury_balance()
    transactions = corridor_mcp.export_transactions(last_week())
    tier_usage = corridor_mcp.check_tier_limits()
    
    # AI analysis
    report = ai_generate_report({
        "balances": balances,
        "transactions": transactions,
        "usage": tier_usage
    })
    
    # Distribute report
    send_to_stakeholders(report)
```

### Performance Metrics

Track key financial KPIs:
- Payment processing time
- Treasury utilization rates
- Employee advance patterns
- Cross-currency transaction costs
- API usage efficiency

## Troubleshooting Guide

### Common Integration Issues

**MCP Server Not Responding**
```bash
# Check server status
ps aux | grep corridor-mcp

# Restart with debug logging
PAYDAY_DEBUG=true ./corridor-mcp
```

**API Authentication Failures**
```bash
# Verify API key
curl -H "X-API-Key: $PAYDAY_API_KEY" \
     https://api.corridormoney.net/api/account/profile
```

**Rate Limit Exceeded**
```python
# Implement exponential backoff
import time
import random

def api_call_with_backoff(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError:
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait_time)
    raise Exception("Max retries exceeded")
```

### Performance Optimization

**Connection Pooling**
```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("https://", adapter)
```

**Async Operations**
```python
import asyncio
import aiohttp

async def batch_balance_check(currencies):
    async with aiohttp.ClientSession() as session:
        tasks = [
            check_balance_async(session, currency)
            for currency in currencies
        ]
        return await asyncio.gather(*tasks)
```

## Future Roadmap

### Upcoming Features

**Enhanced AI Capabilities**
- Natural language financial queries
- Predictive analytics and forecasting
- Automated compliance monitoring
- Smart contract integration

**Extended Integrations**
- QuickBooks synchronization
- Xero accounting integration
- Stripe Connect marketplace
- Multi-bank connectivity

**Advanced Workflows**
- Visual workflow builder
- Custom business rule engine
- Real-time collaboration tools
- Mobile AI assistant

### Community Contributions

We welcome community contributions:
- Custom MCP tools
- Integration templates
- Workflow examples
- Documentation improvements

Join our developer community at [github.com/corridrlabs](https://github.com/corridrlabs).
