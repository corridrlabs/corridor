# Rust SDK Documentation

High-performance Rust client library for the Corridor API with zero-cost abstractions, comprehensive error handling, and async support.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
corridor = "0.8.2"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

## Quick Start

```rust
use corridor::{CorridorClient, SplitPaymentRequest, Recipient};
use tokio;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize client
    let client = CorridorClient::new("your-api-key");
    
    // Create split payment
    let payment = client.payments().create_split(SplitPaymentRequest {
        amount: 100.0,
        currency: "USDC".to_string(),
        recipients: vec![
            Recipient { wallet_id: "wallet-1".to_string(), percentage: 60 },
            Recipient { wallet_id: "wallet-2".to_string(), percentage: 40 },
        ],
        message: Some("Team bonus distribution".to_string()),
    }).await?;
    
    println!("Payment created: {}", payment.id);
    Ok(())
}
```

## Configuration

### Basic Configuration

```rust
use corridor::{CorridorClient, Config, Environment};

// Using environment variable
let client = CorridorClient::from_env()?;

// Custom configuration
let config = Config {
    api_key: "your-api-key".to_string(),
    environment: Environment::Sandbox,
    timeout: std::time::Duration::from_secs(30),
    max_retries: 3,
    ..Default::default()
};

let client = CorridorClient::with_config(config);
```

### Advanced Configuration

```rust
use corridor::{CorridorClient, Config, RetryPolicy};
use reqwest::Client;
use std::time::Duration;

let http_client = Client::builder()
    .timeout(Duration::from_secs(30))
    .pool_max_idle_per_host(10)
    .build()?;

let config = Config {
    api_key: "your-api-key".to_string(),
    base_url: "https://api-sandbox.corridormoney.net".to_string(),
    http_client: Some(http_client),
    retry_policy: RetryPolicy::ExponentialBackoff {
        max_retries: 5,
        base_delay: Duration::from_millis(100),
        max_delay: Duration::from_secs(10),
    },
    ..Default::default()
};

let client = CorridorClient::with_config(config);
```

## Core Services

### Payments Service

```rust
use corridor::{SplitPaymentRequest, Recipient, PaymentStatus};

// Create split payment
let split_request = SplitPaymentRequest {
    amount: 500.0,
    currency: "USDC".to_string(),
    recipients: vec![
        Recipient { wallet_id: "wallet-1".to_string(), percentage: 50 },
        Recipient { wallet_id: "wallet-2".to_string(), percentage: 30 },
        Recipient { wallet_id: "wallet-3".to_string(), percentage: 20 },
    ],
    message: Some("Quarterly bonus".to_string()),
};

let payment = client.payments().create_split(split_request).await?;

// Get payment details
let payment = client.payments().get(&payment.id).await?;
println!("Payment status: {:?}", payment.status);

// List payments with filtering
let payments = client.payments().list(corridor::ListPaymentsRequest {
    status: Some(PaymentStatus::Completed),
    currency: Some("USDC".to_string()),
    limit: Some(50),
    cursor: None,
}).await?;

for payment in payments.data {
    println!("Payment {}: {} {}", payment.id, payment.amount, payment.currency);
}
```

### Social Goals Service

```rust
use corridor::{CreateGoalRequest, ContributeRequest};

// Create crowdfunding goal
let goal_request = CreateGoalRequest {
    title: "Team Building Event".to_string(),
    description: Some("Annual team building and retreat".to_string()),
    target_amount: 2000.0,
    currency: "USDC".to_string(),
    product_link: Some("https://example.com/event-details".to_string()),
};

let goal = client.goals().create(goal_request).await?;

// Contribute to goal
let contribution = client.goals().contribute(&goal.id, ContributeRequest {
    contributor_name: Some("Alice Johnson".to_string()),
    amount: 50.0,
    currency: "USDC".to_string(),
}).await?;

println!("Contribution: {}", contribution.id);

// Get goal with contributions
let goal = client.goals().get(&goal.id, Some(true)).await?;
println!("Goal progress: {}/{}", goal.current_amount, goal.target_amount);
```

### Wallets Service

```rust
use corridor::{CreateWalletRequest, ListWalletsRequest};

// Get wallet balance
let balance = client.wallets().get_balance("wallet-id").await?;
println!("Balance: {} {}", balance.amount, balance.currency);

// List wallets
let wallets = client.wallets().list(ListWalletsRequest {
    account_id: Some("account-id".to_string()),
    currency: Some("USDC".to_string()),
    ..Default::default()
}).await?;

for wallet in wallets.data {
    println!("Wallet {}: {} {}", wallet.id, wallet.balance, wallet.currency);
}

// Create new wallet
let wallet = client.wallets().create(CreateWalletRequest {
    account_id: "account-id".to_string(),
    currency: "USDC".to_string(),
}).await?;
```

### EWA Service

```rust
use corridor::{EWARequest, EWAStatus, ListEWARequestsOptions};

// Request wage advance (employee)
let ewa_request = EWARequest {
    amount: 200.0,
    reason: Some("Emergency medical expense".to_string()),
};

let request = client.ewa().request_advance(ewa_request).await?;

// Admin: List EWA requests (Tier 2+ required)
let requests = client.ewa().list_requests(ListEWARequestsOptions {
    status: Some(EWAStatus::Pending),
    limit: Some(50),
    ..Default::default()
}).await?;

// Admin: Approve request
client.ewa().approve_request(&request.id).await?;

// Admin: Get employee settings
let settings = client.ewa().get_employee_settings("employee-id").await?;
println!("Max withdrawal: {}", settings.max_withdrawal_per_period);
```

## Error Handling

The SDK provides comprehensive error types:

```rust
use corridor::{CorridorError, ValidationError, AuthenticationError, RateLimitError};

match client.payments().create_split(request).await {
    Ok(payment) => println!("Payment created: {}", payment.id),
    Err(CorridorError::Validation(ValidationError { message, field_errors })) => {
        println!("Validation failed: {}", message);
        for (field, errors) in field_errors {
            println!("  {}: {:?}", field, errors);
        }
    },
    Err(CorridorError::Authentication(AuthenticationError { message })) => {
        println!("Authentication failed: {}", message);
    },
    Err(CorridorError::RateLimit(RateLimitError { retry_after, .. })) => {
        println!("Rate limited. Retry after: {:?}", retry_after);
    },
    Err(CorridorError::Api { status_code, message }) => {
        println!("API error {}: {}", status_code, message);
    },
    Err(e) => println!("Unexpected error: {}", e),
}
```

### Custom Error Handling

```rust
use corridor::CorridorError;

fn handle_corridor_error(error: CorridorError) -> String {
    match error {
        CorridorError::Validation(e) => format!("Validation error: {}", e.message),
        CorridorError::Authentication(_) => "Please check your API key".to_string(),
        CorridorError::RateLimit(e) => format!("Rate limited, retry in {:?}", e.retry_after),
        CorridorError::Network(e) => format!("Network error: {}", e),
        CorridorError::Api { status_code, message } => {
            format!("API error {}: {}", status_code, message)
        },
        _ => "Unknown error occurred".to_string(),
    }
}
```

## Webhooks

### Webhook Verification

```rust
use corridor::webhooks::{verify_signature, parse_event, WebhookEvent};
use warp::{Filter, Reply};

async fn handle_webhook(
    body: bytes::Bytes,
    signature: String,
) -> Result<impl Reply, warp::Rejection> {
    // Verify signature
    let payload = verify_signature(&body, &signature, "your-webhook-secret")
        .map_err(|_| warp::reject::custom(InvalidSignature))?;
    
    // Parse event
    let event: WebhookEvent = parse_event(&payload)
        .map_err(|_| warp::reject::custom(InvalidPayload))?;
    
    // Handle different event types
    match event.event_type.as_str() {
        "payment.completed" => handle_payment_completed(event.data).await,
        "goal.completed" => handle_goal_completed(event.data).await,
        _ => println!("Unhandled event type: {}", event.event_type),
    }
    
    Ok(warp::reply::with_status("OK", warp::http::StatusCode::OK))
}

async fn handle_payment_completed(data: serde_json::Value) {
    if let Some(payment_id) = data.get("payment_id").and_then(|v| v.as_str()) {
        println!("Payment completed: {}", payment_id);
        // Update your database, send notifications, etc.
    }
}

#[derive(Debug)]
struct InvalidSignature;
impl warp::reject::Reject for InvalidSignature {}

#[derive(Debug)]
struct InvalidPayload;
impl warp::reject::Reject for InvalidPayload {}
```

### Webhook Management

```rust
use corridor::{CreateWebhookRequest, WebhookEvent};

// Create webhook endpoint
let webhook = client.webhooks().create(CreateWebhookRequest {
    url: "https://your-app.com/webhooks/corridor".to_string(),
    events: vec![
        "payment.completed".to_string(),
        "payment.failed".to_string(),
        "goal.completed".to_string(),
    ],
}).await?;

// Test webhook endpoint
let result = client.webhooks().test(&webhook.id).await?;
println!("Test result: {} (Response: {}ms)", result.success, result.response_time_ms);

// List webhooks
let webhooks = client.webhooks().list().await?;
for webhook in webhooks {
    println!("Webhook {}: {}", webhook.id, webhook.url);
}
```

## Async Patterns

### Concurrent Operations

```rust
use tokio::try_join;

async fn process_multiple_payments(
    client: &CorridorClient,
    payment_requests: Vec<SplitPaymentRequest>,
) -> Result<Vec<SplitPayment>, CorridorError> {
    let futures = payment_requests
        .into_iter()
        .map(|req| client.payments().create_split(req));
    
    // Execute all payments concurrently
    let results = futures::future::try_join_all(futures).await?;
    Ok(results)
}

// Usage
let requests = vec![
    SplitPaymentRequest { /* ... */ },
    SplitPaymentRequest { /* ... */ },
    SplitPaymentRequest { /* ... */ },
];

let payments = process_multiple_payments(&client, requests).await?;
```

### Stream Processing

```rust
use futures::StreamExt;
use corridor::PaymentStream;

async fn process_payment_stream(client: &CorridorClient) -> Result<(), CorridorError> {
    let mut stream = client.payments().stream()?;
    
    while let Some(payment_result) = stream.next().await {
        match payment_result {
            Ok(payment) => {
                println!("Received payment: {} - {} {}", 
                    payment.id, payment.amount, payment.currency);
                
                // Process payment
                process_payment(payment).await?;
            },
            Err(e) => {
                eprintln!("Stream error: {}", e);
                // Decide whether to continue or break
            }
        }
    }
    
    Ok(())
}
```

## Serde Integration

### Custom Serialization

```rust
use serde::{Deserialize, Serialize};
use corridor::{SplitPaymentRequest, Recipient};

#[derive(Serialize, Deserialize)]
struct TeamPayment {
    team_id: String,
    total_amount: f64,
    members: Vec<TeamMember>,
}

#[derive(Serialize, Deserialize)]
struct TeamMember {
    wallet_id: String,
    performance_score: f64,
}

impl From<TeamPayment> for SplitPaymentRequest {
    fn from(team_payment: TeamPayment) -> Self {
        let total_score: f64 = team_payment.members.iter()
            .map(|m| m.performance_score)
            .sum();
        
        let recipients = team_payment.members.into_iter()
            .map(|member| Recipient {
                wallet_id: member.wallet_id,
                percentage: (member.performance_score / total_score) * 100.0,
            })
            .collect();
        
        SplitPaymentRequest {
            amount: team_payment.total_amount,
            currency: "USDC".to_string(),
            recipients,
            message: Some(format!("Team {} bonus", team_payment.team_id)),
        }
    }
}

// Usage
let team_payment: TeamPayment = serde_json::from_str(&json_data)?;
let split_request: SplitPaymentRequest = team_payment.into();
let payment = client.payments().create_split(split_request).await?;
```

## Testing

### Mock Client

```rust
use corridor::{CorridorClient, SplitPayment, MockClient};

#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;
    
    #[tokio::test]
    async fn test_payment_creation() {
        let mut mock_client = MockClient::new();
        
        // Set up mock response
        let expected_payment = SplitPayment {
            id: "split_123".to_string(),
            status: corridor::PaymentStatus::Completed,
            amount: 100.0,
            currency: "USDC".to_string(),
            recipients: vec![],
            created_at: chrono::Utc::now(),
        };
        
        mock_client
            .expect_create_split_payment()
            .returning(move |_| Ok(expected_payment.clone()));
        
        // Test your code
        let result = create_team_payment(&mock_client, team_data).await;
        
        assert!(result.is_ok());
        let payment = result.unwrap();
        assert_eq!(payment.id, "split_123");
    }
}
```

### Integration Tests

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;
    use corridor::{CorridorClient, Environment};
    
    fn test_client() -> CorridorClient {
        CorridorClient::with_config(corridor::Config {
            api_key: std::env::var("PAYDAY_TEST_API_KEY")
                .expect("PAYDAY_TEST_API_KEY must be set"),
            environment: Environment::Sandbox,
            ..Default::default()
        })
    }
    
    #[tokio::test]
    async fn test_split_payment_flow() {
        let client = test_client();
        
        let request = SplitPaymentRequest {
            amount: 10.0, // Small amount for testing
            currency: "USDC".to_string(),
            recipients: vec![
                Recipient { wallet_id: "test-wallet-1".to_string(), percentage: 60 },
                Recipient { wallet_id: "test-wallet-2".to_string(), percentage: 40 },
            ],
            message: Some("Integration test".to_string()),
        };
        
        let payment = client.payments().create_split(request).await
            .expect("Failed to create split payment");
        
        assert!(!payment.id.is_empty());
        assert_eq!(payment.amount, 10.0);
        assert_eq!(payment.recipients.len(), 2);
    }
}
```

## Performance Optimization

### Connection Pooling

```rust
use corridor::{CorridorClient, Config};
use reqwest::Client;
use std::sync::Arc;

// Create a shared HTTP client with connection pooling
let http_client = Client::builder()
    .pool_max_idle_per_host(20)
    .pool_idle_timeout(std::time::Duration::from_secs(30))
    .build()?;

let config = Config {
    api_key: "your-api-key".to_string(),
    http_client: Some(http_client),
    ..Default::default()
};

// Share the client across your application
let client = Arc::new(CorridorClient::with_config(config));
```

### Batch Operations

```rust
use futures::stream::{self, StreamExt};

async fn process_payments_in_batches(
    client: &CorridorClient,
    requests: Vec<SplitPaymentRequest>,
    batch_size: usize,
) -> Result<Vec<SplitPayment>, CorridorError> {
    let results = stream::iter(requests)
        .chunks(batch_size)
        .map(|batch| async move {
            let futures = batch.into_iter()
                .map(|req| client.payments().create_split(req));
            
            futures::future::try_join_all(futures).await
        })
        .buffer_unordered(3) // Process up to 3 batches concurrently
        .collect::<Vec<_>>()
        .await;
    
    // Flatten results
    let mut all_payments = Vec::new();
    for batch_result in results {
        all_payments.extend(batch_result?);
    }
    
    Ok(all_payments)
}
```

## Examples

### Complete Payment Service

```rust
use corridor::{CorridorClient, SplitPaymentRequest, Recipient, PaymentStatus};
use std::time::Duration;
use tokio::time::sleep;

pub struct PaymentService {
    client: CorridorClient,
}

impl PaymentService {
    pub fn new(api_key: String) -> Self {
        let client = CorridorClient::new(&api_key);
        Self { client }
    }
    
    pub async fn process_team_bonus(
        &self,
        team_members: Vec<TeamMember>,
        total_amount: f64,
    ) -> Result<SplitPayment, CorridorError> {
        // Calculate percentages based on performance scores
        let total_score: f64 = team_members.iter()
            .map(|m| m.performance_score)
            .sum();
        
        let recipients = team_members.into_iter()
            .map(|member| Recipient {
                wallet_id: member.wallet_id,
                percentage: (member.performance_score / total_score) * 100.0,
            })
            .collect();
        
        // Create split payment
        let payment = self.client.payments().create_split(SplitPaymentRequest {
            amount: total_amount,
            currency: "USDC".to_string(),
            recipients,
            message: Some("Q4 Performance Bonus".to_string()),
        }).await?;
        
        // Wait for completion
        self.wait_for_completion(&payment.id).await
    }
    
    async fn wait_for_completion(&self, payment_id: &str) -> Result<SplitPayment, CorridorError> {
        const MAX_ATTEMPTS: u32 = 30;
        const POLL_INTERVAL: Duration = Duration::from_secs(5);
        
        for _ in 0..MAX_ATTEMPTS {
            let payment = self.client.payments().get(payment_id).await?;
            
            match payment.status {
                PaymentStatus::Completed => return Ok(payment),
                PaymentStatus::Failed => {
                    return Err(CorridorError::Api {
                        status_code: 400,
                        message: format!("Payment failed: {:?}", payment.failure_reason),
                    });
                },
                _ => {
                    sleep(POLL_INTERVAL).await;
                }
            }
        }
        
        Err(CorridorError::Api {
            status_code: 408,
            message: "Payment completion timeout".to_string(),
        })
    }
}

#[derive(Clone)]
pub struct TeamMember {
    pub wallet_id: String,
    pub performance_score: f64,
}
```

## Support

- **Documentation**: [https://docs.corridormoney.net/rust-sdk](https://docs.corridormoney.net/rust-sdk)
- **Crates.io**: [https://crates.io/crates/corridor](https://crates.io/crates/corridor)
- **GitHub**: [https://github.com/corridor/corridor-rust](https://github.com/corridor/corridor-rust)
- **Issues**: [https://github.com/corridor/corridor-rust/issues](https://github.com/corridor/corridor-rust/issues)
- **Email**: developers@corridormoney.net