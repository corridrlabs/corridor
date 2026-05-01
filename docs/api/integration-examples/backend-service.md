# Backend Service Integration

This guide shows how to integrate Corridor APIs into backend services and microservices for server-side payment processing and automation.

## Go Service Integration

### Service Setup

```go
// main.go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/gorilla/mux"
    "github.com/corridor/corridor-go"
)

type PaymentService struct {
    corridorClient *corridor.Client
}

func NewPaymentService() *PaymentService {
    client := corridor.NewClient(os.Getenv("PAYDAY_API_KEY"))
    return &PaymentService{
        corridorClient: client,
    }
}

func main() {
    service := NewPaymentService()
    
    r := mux.NewRouter()
    r.HandleFunc("/api/payroll/process", service.ProcessPayroll).Methods("POST")
    r.HandleFunc("/api/payments/split", service.CreateSplitPayment).Methods("POST")
    r.HandleFunc("/api/webhooks/corridor", service.HandleWebhook).Methods("POST")
    
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", r))
}
```

### Payroll Processing

```go
// payroll.go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/corridor/corridor-go"
)

type Employee struct {
    ID       string  `json:"id"`
    WalletID string  `json:"wallet_id"`
    Salary   float64 `json:"salary"`
    Name     string  `json:"name"`
}

type PayrollRequest struct {
    Employees []Employee `json:"employees"`
    PayPeriod string     `json:"pay_period"`
    TotalAmount float64  `json:"total_amount"`
}

func (ps *PaymentService) ProcessPayroll(w http.ResponseWriter, r *http.Request) {
    var req PayrollRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Process each employee payment
    results := make(map[string]interface{})
    
    for _, employee := range req.Employees {
        payment, err := ps.corridorClient.Payments.CreateSplit(ctx, &corridor.SplitPaymentRequest{
            Amount:   employee.Salary,
            Currency: "USDC",
            Recipients: []corridor.Recipient{
                {
                    WalletID:   employee.WalletID,
                    Percentage: 100,
                },
            },
            Message: fmt.Sprintf("Salary payment for %s - %s", employee.Name, req.PayPeriod),
        })

        if err != nil {
            results[employee.ID] = map[string]interface{}{
                "status": "failed",
                "error":  err.Error(),
            }
            continue
        }

        results[employee.ID] = map[string]interface{}{
            "status":     "success",
            "payment_id": payment.ID,
            "amount":     payment.Amount,
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "payroll_id": fmt.Sprintf("payroll_%d", time.Now().Unix()),
        "results":    results,
        "processed_at": time.Now(),
    })
}
```

### Batch Payment Processing

```go
// batch.go
package main

import (
    "context"
    "sync"
    "time"

    "github.com/corridor/corridor-go"
)

type BatchProcessor struct {
    client     *corridor.Client
    batchSize  int
    maxWorkers int
}

func NewBatchProcessor(client *corridor.Client) *BatchProcessor {
    return &BatchProcessor{
        client:     client,
        batchSize:  10,
        maxWorkers: 5,
    }
}

func (bp *BatchProcessor) ProcessPayments(ctx context.Context, payments []corridor.SplitPaymentRequest) ([]corridor.SplitPayment, []error) {
    jobs := make(chan corridor.SplitPaymentRequest, len(payments))
    results := make(chan result, len(payments))

    // Start workers
    var wg sync.WaitGroup
    for i := 0; i < bp.maxWorkers; i++ {
        wg.Add(1)
        go bp.worker(ctx, &wg, jobs, results)
    }

    // Send jobs
    for _, payment := range payments {
        jobs <- payment
    }
    close(jobs)

    // Wait for completion
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    var successfulPayments []corridor.SplitPayment
    var errors []error

    for result := range results {
        if result.err != nil {
            errors = append(errors, result.err)
        } else {
            successfulPayments = append(successfulPayments, result.payment)
        }
    }

    return successfulPayments, errors
}

type result struct {
    payment corridor.SplitPayment
    err     error
}

func (bp *BatchProcessor) worker(ctx context.Context, wg *sync.WaitGroup, jobs <-chan corridor.SplitPaymentRequest, results chan<- result) {
    defer wg.Done()

    for job := range jobs {
        payment, err := bp.client.Payments.CreateSplit(ctx, &job)
        results <- result{payment: payment, err: err}
        
        // Rate limiting
        time.Sleep(100 * time.Millisecond)
    }
}
```

## Python Service Integration

### FastAPI Service

```python
# main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from corridor import AsyncCorridorClient
import os

app = FastAPI(title="Payment Service", version="1.0.0")

# Initialize Corridor client
corridor_client = AsyncCorridorClient(api_key=os.getenv("PAYDAY_API_KEY"))

class Employee(BaseModel):
    id: str
    wallet_id: str
    salary: float
    name: str

class PayrollRequest(BaseModel):
    employees: List[Employee]
    pay_period: str
    total_amount: float

class SplitPaymentRequest(BaseModel):
    amount: float
    currency: str = "USDC"
    recipients: List[dict]
    message: Optional[str] = None

@app.post("/api/payroll/process")
async def process_payroll(request: PayrollRequest, background_tasks: BackgroundTasks):
    """Process payroll for multiple employees"""
    
    # Process payments in background
    background_tasks.add_task(process_payroll_async, request)
    
    return {
        "payroll_id": f"payroll_{int(time.time())}",
        "status": "processing",
        "employee_count": len(request.employees)
    }

async def process_payroll_async(request: PayrollRequest):
    """Background task to process payroll payments"""
    
    tasks = []
    for employee in request.employees:
        task = corridor_client.payments.create_split(
            amount=employee.salary,
            currency="USDC",
            recipients=[{
                "wallet_id": employee.wallet_id,
                "percentage": 100
            }],
            message=f"Salary payment for {employee.name} - {request.pay_period}"
        )
        tasks.append(task)
    
    # Process all payments concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Log results or send notifications
    for i, result in enumerate(results):
        employee = request.employees[i]
        if isinstance(result, Exception):
            print(f"Payment failed for {employee.name}: {result}")
        else:
            print(f"Payment successful for {employee.name}: {result.id}")

@app.post("/api/payments/split")
async def create_split_payment(request: SplitPaymentRequest):
    """Create a split payment"""
    
    try:
        payment = await corridor_client.payments.create_split(
            amount=request.amount,
            currency=request.currency,
            recipients=request.recipients,
            message=request.message
        )
        
        return {
            "payment_id": payment.id,
            "status": payment.status,
            "amount": payment.amount,
            "currency": payment.currency
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/webhooks/corridor")
async def handle_webhook(request: dict):
    """Handle Corridor webhooks"""
    
    event_type = request.get("type")
    data = request.get("data", {})
    
    if event_type == "payment.completed":
        await handle_payment_completed(data)
    elif event_type == "payment.failed":
        await handle_payment_failed(data)
    elif event_type == "goal.completed":
        await handle_goal_completed(data)
    
    return {"status": "received"}

async def handle_payment_completed(data: dict):
    """Handle successful payment"""
    payment_id = data.get("payment_id")
    print(f"Payment completed: {payment_id}")
    
    # Update database, send notifications, etc.

async def handle_payment_failed(data: dict):
    """Handle failed payment"""
    payment_id = data.get("payment_id")
    error = data.get("error")
    print(f"Payment failed: {payment_id} - {error}")
    
    # Handle failure, retry logic, notifications

async def handle_goal_completed(data: dict):
    """Handle completed goal"""
    goal_id = data.get("goal_id")
    print(f"Goal completed: {goal_id}")
    
    # Celebrate, send rewards, notifications
```

### Celery Background Tasks

```python
# tasks.py
from celery import Celery
from corridor import CorridorClient
import os

# Initialize Celery
celery_app = Celery('payment_service')
celery_app.config_from_object('celeryconfig')

# Initialize Corridor client
corridor_client = CorridorClient(api_key=os.getenv("PAYDAY_API_KEY"))

@celery_app.task(bind=True, max_retries=3)
def process_payment(self, payment_data):
    """Process a single payment with retry logic"""
    
    try:
        payment = corridor_client.payments.create_split(
            amount=payment_data['amount'],
            currency=payment_data['currency'],
            recipients=payment_data['recipients'],
            message=payment_data.get('message')
        )
        
        return {
            'status': 'success',
            'payment_id': payment.id,
            'amount': payment.amount
        }
        
    except Exception as exc:
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        
        return {
            'status': 'failed',
            'error': str(exc)
        }

@celery_app.task
def process_batch_payments(payment_batch):
    """Process multiple payments in batch"""
    
    results = []
    for payment_data in payment_batch:
        # Queue individual payment tasks
        task = process_payment.delay(payment_data)
        results.append(task.id)
    
    return {
        'batch_id': f"batch_{int(time.time())}",
        'task_ids': results,
        'count': len(payment_batch)
    }

@celery_app.task
def reconcile_payments():
    """Daily reconciliation task"""
    
    # Get payments from last 24 hours
    payments = corridor_client.payments.list(
        from_date=datetime.now() - timedelta(days=1),
        to_date=datetime.now()
    )
    
    # Reconcile with internal records
    for payment in payments.data:
        # Check against internal database
        # Flag discrepancies
        # Generate reports
        pass
    
    return f"Reconciled {len(payments.data)} payments"
```

## Node.js Microservice

### Express Service

```javascript
// server.js
const express = require('express');
const { CorridorClient } = require('@corridor/sdk');
const { Queue } = require('bull');
const Redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Corridor client
const corridorClient = new CorridorClient({
  apiKey: process.env.PAYDAY_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

// Initialize Redis and Bull queue
const redis = Redis.createClient(process.env.REDIS_URL);
const paymentQueue = new Queue('payment processing', process.env.REDIS_URL);

app.use(express.json());

// Process payment queue
paymentQueue.process('split-payment', async (job) => {
  const { amount, currency, recipients, message } = job.data;
  
  try {
    const payment = await corridorClient.payments.createSplit({
      amount,
      currency,
      recipients,
      message
    });
    
    return { success: true, paymentId: payment.id };
  } catch (error) {
    throw new Error(`Payment failed: ${error.message}`);
  }
});

// API Routes
app.post('/api/payments/split', async (req, res) => {
  try {
    const { amount, currency, recipients, message } = req.body;
    
    // Add to queue for processing
    const job = await paymentQueue.add('split-payment', {
      amount,
      currency,
      recipients,
      message
    });
    
    res.json({
      jobId: job.id,
      status: 'queued',
      message: 'Payment queued for processing'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payroll/process', async (req, res) => {
  try {
    const { employees, payPeriod } = req.body;
    
    // Queue individual payments
    const jobs = [];
    for (const employee of employees) {
      const job = await paymentQueue.add('split-payment', {
        amount: employee.salary,
        currency: 'USDC',
        recipients: [{ walletId: employee.walletId, percentage: 100 }],
        message: `Salary payment for ${employee.name} - ${payPeriod}`
      });
      jobs.push(job.id);
    }
    
    res.json({
      payrollId: `payroll_${Date.now()}`,
      jobIds: jobs,
      employeeCount: employees.length,
      status: 'processing'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks/corridor', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    switch (type) {
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
      case 'goal.completed':
        await handleGoalCompleted(data);
        break;
      default:
        console.log('Unhandled webhook type:', type);
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

async function handlePaymentCompleted(data) {
  console.log('Payment completed:', data.paymentId);
  
  // Update database
  // Send notifications
  // Trigger other services
}

async function handlePaymentFailed(data) {
  console.log('Payment failed:', data.paymentId, data.error);
  
  // Handle failure
  // Retry logic
  // Alert administrators
}

async function handleGoalCompleted(data) {
  console.log('Goal completed:', data.goalId);
  
  // Celebrate completion
  // Send rewards
  // Update metrics
}

app.listen(port, () => {
  console.log(`Payment service listening on port ${port}`);
});
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
      - name: payment-service
        image: your-registry/payment-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: PAYDAY_API_KEY
          valueFrom:
            secretKeyRef:
              name: corridor-secrets
              key: api-key
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: payment-service
spec:
  selector:
    app: payment-service
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: Secret
metadata:
  name: corridor-secrets
type: Opaque
data:
  api-key: <base64-encoded-api-key>
```

## Monitoring and Observability

### Prometheus Metrics

```go
// metrics.go
package main

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    paymentsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "corridor_payments_total",
            Help: "Total number of payments processed",
        },
        []string{"status", "currency"},
    )
    
    paymentDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "corridor_payment_duration_seconds",
            Help: "Payment processing duration",
        },
        []string{"operation"},
    )
    
    paymentAmount = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "corridor_payment_amount",
            Help: "Payment amounts",
            Buckets: []float64{1, 10, 100, 1000, 10000},
        },
        []string{"currency"},
    )
)

func recordPaymentMetrics(status, currency string, amount float64, duration time.Duration) {
    paymentsTotal.WithLabelValues(status, currency).Inc()
    paymentDuration.WithLabelValues("create_split").Observe(duration.Seconds())
    paymentAmount.WithLabelValues(currency).Observe(amount)
}
```

### Structured Logging

```python
# logging_config.py
import logging
import json
from datetime import datetime

class CorridorFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'service': 'payment-service',
        }
        
        # Add extra fields if present
        if hasattr(record, 'payment_id'):
            log_entry['payment_id'] = record.payment_id
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'amount'):
            log_entry['amount'] = record.amount
            
        return json.dumps(log_entry)

# Configure logger
logger = logging.getLogger('corridor')
handler = logging.StreamHandler()
handler.setFormatter(CorridorFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usage
logger.info("Payment processed successfully", 
           extra={'payment_id': 'pay_123', 'amount': 100.0})
```

## Best Practices

1. **Idempotency**: Use idempotency keys for payment operations
2. **Rate Limiting**: Implement proper rate limiting to avoid API limits
3. **Error Handling**: Implement comprehensive error handling and retry logic
4. **Monitoring**: Add metrics and logging for observability
5. **Security**: Secure API keys and validate webhook signatures
6. **Testing**: Write comprehensive unit and integration tests
7. **Documentation**: Document your service APIs and integration points

## Support

For backend integration help:
- Email: backend@corridormoney.net
- Documentation: https://docs.corridormoney.net/backend
- GitHub: https://github.com/corridor/examples