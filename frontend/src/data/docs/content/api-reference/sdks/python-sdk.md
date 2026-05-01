# Python SDK Documentation

The official Python client library for the Corridor API with async support, Django integration, and comprehensive error handling.

## Installation

```bash
pip install corridor-python
```

For async support:
```bash
pip install corridor-python[async]
```

For Django integration:
```bash
pip install corridor-python[django]
```

## Quick Start

### Synchronous Client

```python
from corridor import CorridorClient

# Initialize client
client = CorridorClient(api_key="your-api-key")

# Create split payment
payment = client.payments.create_split(
    amount=100.00,
    currency="USDC",
    recipients=[
        {"wallet_id": "wallet-1", "percentage": 60},
        {"wallet_id": "wallet-2", "percentage": 40}
    ],
    message="Team bonus distribution"
)

print(f"Payment created: {payment.id}")
```

### Asynchronous Client

```python
import asyncio
from corridor import AsyncCorridorClient

async def main():
    # Initialize async client
    client = AsyncCorridorClient(api_key="your-api-key")
    
    # Create split payment
    payment = await client.payments.create_split(
        amount=100.00,
        currency="USDC",
        recipients=[
            {"wallet_id": "wallet-1", "percentage": 60},
            {"wallet_id": "wallet-2", "percentage": 40}
        ]
    )
    
    print(f"Payment created: {payment.id}")
    
    # Don't forget to close the client
    await client.close()

# Run async function
asyncio.run(main())
```

## Configuration

### Environment Variables

```python
import os
from corridor import CorridorClient

# Uses PAYDAY_API_KEY environment variable
client = CorridorClient()

# Or specify explicitly
client = CorridorClient(api_key=os.getenv("PAYDAY_API_KEY"))
```

### Custom Configuration

```python
from corridor import CorridorClient, Config

config = Config(
    api_key="your-api-key",
    base_url="https://api-sandbox.corridormoney.net",  # Use sandbox
    timeout=30.0,
    max_retries=3,
    retry_backoff_factor=0.5
)

client = CorridorClient(config=config)
```

## Core Services

### Payments Service

```python
# Create split payment
payment = client.payments.create_split(
    amount=500.00,
    currency="USDC",
    recipients=[
        {"wallet_id": "wallet-1", "percentage": 50},
        {"wallet_id": "wallet-2", "percentage": 30},
        {"wallet_id": "wallet-3", "percentage": 20}
    ]
)

# Get payment details
payment = client.payments.get(payment.id)
print(f"Payment status: {payment.status}")

# List payments with filtering
payments = client.payments.list(
    status="completed",
    currency="USDC",
    limit=50
)

for payment in payments:
    print(f"Payment {payment.id}: {payment.amount} {payment.currency}")
```

### Social Goals Service

```python
# Create crowdfunding goal
goal = client.goals.create(
    title="Team Building Event",
    description="Annual team building and retreat",
    target_amount=2000.00,
    currency="USDC",
    product_link="https://example.com/event-details"
)

# Contribute to goal
contribution = client.goals.contribute(
    goal_id=goal.id,
    contributor_name="Alice Johnson",
    amount=50.00,
    currency="USDC"
)

print(f"Contribution: {contribution.id}")

# Get goal with contributions
goal = client.goals.get(goal.id, include_contributions=True)
print(f"Goal progress: {goal.current_amount}/{goal.target_amount}")
```

### Wallets Service

```python
# Get wallet balance
balance = client.wallets.get_balance("wallet-id")
print(f"Balance: {balance.amount} {balance.currency}")

# List wallets
wallets = client.wallets.list(account_id="account-id")
for wallet in wallets:
    print(f"Wallet {wallet.id}: {wallet.balance} {wallet.currency}")

# Create new wallet
wallet = client.wallets.create(
    account_id="account-id",
    currency="USDC"
)
```

### EWA Service

```python
# Request wage advance (employee)
ewa_request = client.ewa.request_advance(
    amount=200.00,
    reason="Emergency medical expense"
)

# Admin: List EWA requests (Tier 2+ required)
requests = client.ewa.list_requests(
    status="pending",
    limit=50
)

# Admin: Approve request
client.ewa.approve_request(ewa_request.id)

# Admin: Get employee EWA settings
settings = client.ewa.get_employee_settings("employee-id")
print(f"Max withdrawal: {settings.max_withdrawal_per_period}")
```

## Error Handling

```python
from corridor.exceptions import (
    CorridorError,
    ValidationError,
    AuthenticationError,
    RateLimitError,
    APIError
)

try:
    payment = client.payments.create_split(
        amount=100.00,
        currency="USDC",
        recipients=[]  # Invalid: empty recipients
    )
except ValidationError as e:
    print(f"Validation failed: {e.message}")
    for field, errors in e.field_errors.items():
        print(f"  {field}: {errors}")
except AuthenticationError as e:
    print(f"Authentication failed: {e.message}")
except RateLimitError as e:
    print(f"Rate limited. Retry after: {e.retry_after} seconds")
except APIError as e:
    print(f"API error {e.status_code}: {e.message}")
except CorridorError as e:
    print(f"Corridor error: {e}")
```

## Webhooks

### Webhook Verification

```python
from corridor.webhooks import verify_signature, parse_event
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhooks/corridor', methods=['POST'])
def handle_webhook():
    try:
        # Verify webhook signature
        payload = verify_signature(
            request.data,
            request.headers.get('X-Corridor-Signature'),
            'your-webhook-secret'
        )
        
        # Parse event
        event = parse_event(payload)
        
        # Handle different event types
        if event.type == 'payment.completed':
            handle_payment_completed(event.data)
        elif event.type == 'goal.completed':
            handle_goal_completed(event.data)
        else:
            print(f"Unhandled event type: {event.type}")
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 400

def handle_payment_completed(data):
    payment_id = data['payment_id']
    amount = data['amount']
    print(f"Payment {payment_id} completed for {amount}")
```

### Webhook Management

```python
# Create webhook endpoint
webhook = client.webhooks.create(
    url="https://your-app.com/webhooks/corridor",
    events=[
        "payment.completed",
        "payment.failed",
        "goal.completed"
    ]
)

# Test webhook
result = client.webhooks.test(webhook.id)
print(f"Test result: {result.success} (Response: {result.response_time_ms}ms)")

# List webhooks
webhooks = client.webhooks.list()
for webhook in webhooks:
    print(f"Webhook {webhook.id}: {webhook.url}")
```

## Django Integration

### Settings Configuration

```python
# settings.py
PAYDAY_CONFIG = {
    'API_KEY': 'your-api-key',
    'BASE_URL': 'https://api-sandbox.corridormoney.net',
    'WEBHOOK_SECRET': 'your-webhook-secret',
}
```

### Django Views

```python
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from corridor.django import get_client, verify_webhook
import json

@csrf_exempt
@require_http_methods(["POST"])
def corridor_webhook(request):
    try:
        event = verify_webhook(request)
        
        if event.type == 'payment.completed':
            # Update your models
            from myapp.models import Payment
            Payment.objects.filter(
                corridor_id=event.data['payment_id']
            ).update(status='completed')
        
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return HttpResponseBadRequest(f'Error: {e}')

# Using the client in views
def create_team_payment(request):
    client = get_client()  # Uses settings configuration
    
    payment = client.payments.create_split(
        amount=float(request.POST['amount']),
        currency=request.POST['currency'],
        recipients=json.loads(request.POST['recipients'])
    )
    
    return JsonResponse({
        'payment_id': payment.id,
        'status': payment.status
    })
```

### Django Models Integration

```python
from django.db import models
from corridor.django import CorridorModelMixin

class TeamPayment(CorridorModelMixin, models.Model):
    team = models.ForeignKey('Team', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USDC')
    corridor_payment_id = models.CharField(max_length=100, blank=True)
    
    def create_corridor_payment(self):
        """Create payment using Corridor API"""
        recipients = [
            {
                'wallet_id': member.wallet_id,
                'percentage': member.bonus_percentage
            }
            for member in self.team.members.all()
        ]
        
        payment = self.get_corridor_client().payments.create_split(
            amount=float(self.amount),
            currency=self.currency,
            recipients=recipients
        )
        
        self.corridor_payment_id = payment.id
        self.save()
        return payment
```

## Async Usage

### Async Context Manager

```python
import asyncio
from corridor import AsyncCorridorClient

async def process_payments():
    async with AsyncCorridorClient(api_key="your-api-key") as client:
        # Create multiple payments concurrently
        tasks = []
        for payment_data in payment_list:
            task = client.payments.create_split(**payment_data)
            tasks.append(task)
        
        # Wait for all payments to complete
        payments = await asyncio.gather(*tasks)
        
        for payment in payments:
            print(f"Created payment: {payment.id}")

asyncio.run(process_payments())
```

### Async Pagination

```python
async def list_all_payments(client):
    all_payments = []
    cursor = None
    
    while True:
        response = await client.payments.list(cursor=cursor, limit=100)
        all_payments.extend(response.data)
        
        if not response.has_more:
            break
        cursor = response.next_cursor
    
    return all_payments
```

## Testing

### Mock Client

```python
import pytest
from unittest.mock import Mock
from corridor import CorridorClient
from corridor.models import SplitPayment

def test_payment_creation():
    # Create mock client
    mock_client = Mock(spec=CorridorClient)
    
    # Set up mock response
    mock_payment = SplitPayment(
        id="split_123",
        status="completed",
        amount=100.00,
        currency="USDC"
    )
    mock_client.payments.create_split.return_value = mock_payment
    
    # Test your code
    result = create_team_bonus(mock_client, team_data)
    
    # Assertions
    assert result.id == "split_123"
    mock_client.payments.create_split.assert_called_once()
```

### Pytest Fixtures

```python
import pytest
from corridor import CorridorClient

@pytest.fixture
def corridor_client():
    return CorridorClient(api_key="test-key", base_url="https://api-sandbox.corridormoney.net")

@pytest.fixture
def sample_payment_data():
    return {
        'amount': 100.00,
        'currency': 'USDC',
        'recipients': [
            {'wallet_id': 'wallet-1', 'percentage': 60},
            {'wallet_id': 'wallet-2', 'percentage': 40}
        ]
    }

def test_split_payment_creation(corridor_client, sample_payment_data):
    payment = corridor_client.payments.create_split(**sample_payment_data)
    assert payment.amount == 100.00
    assert len(payment.recipients) == 2
```

## Examples

### Batch Payment Processing

```python
import asyncio
from corridor import AsyncCorridorClient

async def process_payroll_batch(employee_payments):
    async with AsyncCorridorClient() as client:
        results = []
        
        # Process payments in batches of 10
        batch_size = 10
        for i in range(0, len(employee_payments), batch_size):
            batch = employee_payments[i:i + batch_size]
            
            # Create tasks for this batch
            tasks = [
                client.payments.create_split(
                    amount=payment['amount'],
                    currency='USDC',
                    recipients=[{
                        'wallet_id': payment['employee_wallet'],
                        'percentage': 100
                    }]
                )
                for payment in batch
            ]
            
            # Execute batch
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            results.extend(batch_results)
            
            # Small delay between batches to avoid rate limits
            await asyncio.sleep(0.1)
        
        return results

# Usage
employee_payments = [
    {'employee_id': 'emp_1', 'employee_wallet': 'wallet_1', 'amount': 2500.00},
    {'employee_id': 'emp_2', 'employee_wallet': 'wallet_2', 'amount': 3000.00},
    # ... more employees
]

results = asyncio.run(process_payroll_batch(employee_payments))
```

## Support

- **Documentation**: [https://docs.corridormoney.net/python-sdk](https://docs.corridormoney.net/python-sdk)
- **GitHub**: [https://github.com/corridor/corridor-python](https://github.com/corridor/corridor-python)
- **PyPI**: [https://pypi.org/project/corridor-python/](https://pypi.org/project/corridor-python/)
- **Issues**: [https://github.com/corridor/corridor-python/issues](https://github.com/corridor/corridor-python/issues)
- **Email**: developers@corridormoney.net