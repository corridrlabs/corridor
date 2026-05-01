# Go SDK Documentation

The official Go client library for the Corridor API provides type-safe access to all Corridor services with comprehensive error handling and built-in retry logic.

## Installation

```bash
go get github.com/corridor/corridor-go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"
    
    "github.com/corridor/corridor-go"
)

func main() {
    // Initialize client
    client := corridor.NewClient("your-api-key")
    
    // Create a split payment
    payment, err := client.Payments.CreateSplit(context.Background(), &corridor.SplitPaymentRequest{
        Amount:   100.00,
        Currency: "USDC",
        Recipients: []corridor.Recipient{
            {WalletID: "wallet-1", Percentage: 60},
            {WalletID: "wallet-2", Percentage: 40},
        },
        Message: "Team bonus distribution",
    })
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Payment created: %s\n", payment.ID)
}
```

## Configuration

### Environment-based Configuration

```go
client := corridor.NewClient(os.Getenv("PAYDAY_API_KEY"))
```

### Custom Configuration

```go
config := &corridor.Config{
    APIKey:      "your-api-key",
    BaseURL:     "https://api-sandbox.corridormoney.net", // Use sandbox
    HTTPTimeout: 30 * time.Second,
    RetryConfig: &corridor.RetryConfig{
        MaxRetries: 3,
        BackoffFunc: corridor.ExponentialBackoff,
    },
}

client := corridor.NewClientWithConfig(config)
```

## Core Services

### Payments Service

```go
// Create split payment
splitReq := &corridor.SplitPaymentRequest{
    Amount:   500.00,
    Currency: "USDC",
    Recipients: []corridor.Recipient{
        {WalletID: "wallet-1", Percentage: 50},
        {WalletID: "wallet-2", Percentage: 30},
        {WalletID: "wallet-3", Percentage: 20},
    },
}

payment, err := client.Payments.CreateSplit(ctx, splitReq)
if err != nil {
    return err
}

// Get payment status
payment, err = client.Payments.Get(ctx, payment.ID)
if err != nil {
    return err
}

fmt.Printf("Payment status: %s\n", payment.Status)
```

### Social Goals Service

```go
// Create a crowdfunding goal
goalReq := &corridor.CreateGoalRequest{
    Title:        "Team Building Event",
    Description:  "Annual team building and retreat",
    TargetAmount: 2000.00,
    Currency:     "USDC",
    ProductLink:  "https://example.com/event-details",
}

goal, err := client.Goals.Create(ctx, goalReq)
if err != nil {
    return err
}

// Contribute to goal
contribution, err := client.Goals.Contribute(ctx, goal.ID, &corridor.ContributeRequest{
    ContributorName: "Alice Johnson",
    Amount:          50.00,
    Currency:        "USDC",
})
if err != nil {
    return err
}

fmt.Printf("Contribution: %s\n", contribution.ID)
```

### Wallets Service

```go
// Get wallet balance
balance, err := client.Wallets.GetBalance(ctx, "wallet-id")
if err != nil {
    return err
}

fmt.Printf("Balance: %.2f %s\n", balance.Amount, balance.Currency)

// List all wallets
wallets, err := client.Wallets.List(ctx, &corridor.ListWalletsRequest{
    AccountID: "account-id",
    Currency:  "USDC",
})
if err != nil {
    return err
}

for _, wallet := range wallets {
    fmt.Printf("Wallet %s: %.2f %s\n", wallet.ID, wallet.Balance, wallet.Currency)
}
```

### EWA (Earned Wage Access) Service

```go
// Request wage advance (employee)
ewaReq := &corridor.EWARequest{
    Amount: 200.00,
    Reason: "Emergency medical expense",
}

request, err := client.EWA.RequestAdvance(ctx, ewaReq)
if err != nil {
    return err
}

// Admin: List all EWA requests (Tier 2+ required)
requests, err := client.EWA.ListRequests(ctx, &corridor.ListEWARequestsOptions{
    Status: corridor.EWAStatusPending,
    Limit:  50,
})
if err != nil {
    return err
}

// Admin: Approve EWA request
err = client.EWA.ApproveRequest(ctx, request.ID)
if err != nil {
    return err
}
```

## Error Handling

The SDK provides structured error types for different scenarios:

```go
payment, err := client.Payments.CreateSplit(ctx, req)
if err != nil {
    switch e := err.(type) {
    case *corridor.ValidationError:
        fmt.Printf("Validation failed: %s\n", e.Message)
        for field, errors := range e.FieldErrors {
            fmt.Printf("  %s: %v\n", field, errors)
        }
    case *corridor.AuthenticationError:
        fmt.Printf("Authentication failed: %s\n", e.Message)
    case *corridor.RateLimitError:
        fmt.Printf("Rate limited. Retry after: %v\n", e.RetryAfter)
    case *corridor.APIError:
        fmt.Printf("API error %d: %s\n", e.StatusCode, e.Message)
    default:
        fmt.Printf("Unexpected error: %v\n", err)
    }
    return
}
```

## Webhooks

### Webhook Verification

```go
import (
    "net/http"
    "github.com/corridor/corridor-go/webhook"
)

func handleWebhook(w http.ResponseWriter, r *http.Request) {
    payload, err := webhook.VerifySignature(r, "your-webhook-secret")
    if err != nil {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    
    event, err := webhook.ParseEvent(payload)
    if err != nil {
        http.Error(w, "Invalid payload", http.StatusBadRequest)
        return
    }
    
    switch event.Type {
    case "payment.completed":
        handlePaymentCompleted(event.Data)
    case "goal.completed":
        handleGoalCompleted(event.Data)
    default:
        fmt.Printf("Unhandled event type: %s\n", event.Type)
    }
    
    w.WriteHeader(http.StatusOK)
}

func handlePaymentCompleted(data map[string]interface{}) {
    paymentID := data["payment_id"].(string)
    amount := data["amount"].(float64)
    
    fmt.Printf("Payment %s completed for %.2f\n", paymentID, amount)
}
```

### Webhook Management

```go
// Create webhook endpoint
webhook, err := client.Webhooks.Create(ctx, &corridor.CreateWebhookRequest{
    URL: "https://your-app.com/webhooks/corridor",
    Events: []string{
        "payment.completed",
        "payment.failed",
        "goal.completed",
    },
})
if err != nil {
    return err
}

// Test webhook endpoint
result, err := client.Webhooks.Test(ctx, webhook.ID)
if err != nil {
    return err
}

fmt.Printf("Test result: %v (Response: %dms)\n", result.Success, result.ResponseTimeMs)
```

## Advanced Features

### Context and Cancellation

```go
// Create context with timeout
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

// Context will automatically cancel the request if it takes too long
payment, err := client.Payments.CreateSplit(ctx, req)
if err != nil {
    if ctx.Err() == context.DeadlineExceeded {
        fmt.Println("Request timed out")
    }
    return err
}
```

### Custom HTTP Client

```go
import (
    "net/http"
    "time"
)

httpClient := &http.Client{
    Timeout: 30 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        IdleConnTimeout:     90 * time.Second,
    },
}

config := &corridor.Config{
    APIKey:     "your-api-key",
    HTTPClient: httpClient,
}

client := corridor.NewClientWithConfig(config)
```

### Pagination

```go
// List payments with pagination
opts := &corridor.ListPaymentsOptions{
    Limit:  50,
    Cursor: "", // Start from beginning
}

for {
    payments, err := client.Payments.List(ctx, opts)
    if err != nil {
        return err
    }
    
    for _, payment := range payments.Data {
        fmt.Printf("Payment: %s - %.2f %s\n", payment.ID, payment.Amount, payment.Currency)
    }
    
    if !payments.HasMore {
        break
    }
    
    opts.Cursor = payments.NextCursor
}
```

## Testing

### Mock Client

```go
import (
    "testing"
    "github.com/corridor/corridor-go/mock"
)

func TestPaymentFlow(t *testing.T) {
    mockClient := mock.NewClient()
    
    // Set up mock responses
    mockClient.Payments.On("CreateSplit", mock.Anything, mock.Anything).Return(
        &corridor.SplitPayment{
            ID:     "split_123",
            Status: "completed",
            Amount: 100.00,
        }, nil)
    
    // Test your code
    payment, err := mockClient.Payments.CreateSplit(ctx, req)
    assert.NoError(t, err)
    assert.Equal(t, "split_123", payment.ID)
    
    // Verify mock was called
    mockClient.Payments.AssertExpectations(t)
}
```

## Examples

### Complete Payment Flow

```go
func processTeamBonus(ctx context.Context, client *corridor.Client, teamMembers []TeamMember, totalAmount float64) error {
    // Calculate percentages based on performance scores
    recipients := make([]corridor.Recipient, len(teamMembers))
    totalScore := 0.0
    
    for _, member := range teamMembers {
        totalScore += member.PerformanceScore
    }
    
    for i, member := range teamMembers {
        percentage := (member.PerformanceScore / totalScore) * 100
        recipients[i] = corridor.Recipient{
            WalletID:   member.WalletID,
            Percentage: percentage,
        }
    }
    
    // Create split payment
    payment, err := client.Payments.CreateSplit(ctx, &corridor.SplitPaymentRequest{
        Amount:     totalAmount,
        Currency:   "USDC",
        Recipients: recipients,
        Message:    "Q4 Performance Bonus",
    })
    if err != nil {
        return fmt.Errorf("failed to create split payment: %w", err)
    }
    
    // Wait for completion
    for {
        payment, err = client.Payments.Get(ctx, payment.ID)
        if err != nil {
            return fmt.Errorf("failed to check payment status: %w", err)
        }
        
        if payment.Status == "completed" {
            break
        } else if payment.Status == "failed" {
            return fmt.Errorf("payment failed: %s", payment.FailureReason)
        }
        
        time.Sleep(5 * time.Second)
    }
    
    fmt.Printf("Bonus payment completed: %s\n", payment.ID)
    return nil
}
```

## Support

- **Documentation**: [https://docs.corridormoney.net/go-sdk](https://docs.corridormoney.net/go-sdk)
- **GitHub**: [https://github.com/corridor/corridor-go](https://github.com/corridor/corridor-go)
- **Issues**: [https://github.com/corridor/corridor-go/issues](https://github.com/corridor/corridor-go/issues)
- **Email**: developers@corridormoney.net