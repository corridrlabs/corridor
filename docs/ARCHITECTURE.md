# Corridor System Architecture

This document provides a comprehensive overview of Corridor's system architecture, designed for scalability, security, and global deployment.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
│                     (Nginx/CloudFlare)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   API Gateway                                   │
│                 (Nginx Reverse Proxy)                          │
│                     Port: 8080                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│   Frontend   │ │   API   │ │     MCP     │
│ React/Vite   │ │   Go    │ │   Server    │
│  Port: 3000  │ │Port:8000│ │   Go/JSON   │
└──────────────┘ └────┬────┘ └─────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│ PostgreSQL   │ │  Redis  │ │   Solana    │
│ Multi-Schema │ │ Cache   │ │ Blockchain  │
│  Port: 5432  │ │Port:6379│ │   Network   │
└──────────────┘ └─────────┘ └─────────────┘
```

## 🔧 Service Topology

### Frontend Layer
**React Application (Port 3000)**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for global state, React Query for server state
- **Routing**: React Router v6 with lazy loading
- **PWA**: Service worker for offline capabilities

**Key Components:**
- Authentication flows
- Dashboard interfaces
- Payment processing UI
- Social payment features
- EWA employee portals
- Admin management panels

### API Gateway Layer
**Nginx Reverse Proxy (Port 8080)**
- **Load Balancing**: Round-robin across backend instances
- **SSL Termination**: TLS 1.3 with automatic certificate renewal
- **Rate Limiting**: Per-endpoint and per-user limits
- **CORS Handling**: Secure cross-origin resource sharing
- **Request Logging**: Structured logging for monitoring
- **Health Checks**: Automatic failover for unhealthy backends

**Configuration:**
```nginx
upstream backend {
    server backend:8000 max_fails=3 fail_timeout=30s;
    server backend-2:8000 max_fails=3 fail_timeout=30s;
}

location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Backend Services Layer

#### Main API Service (Go - Port 8000)
**Core Architecture:**
```
backend/
├── cmd/api/              # HTTP handlers and routes
│   ├── main.go          # Server initialization
│   ├── handlers_auth.go # Authentication endpoints
│   ├── handlers_payments.go # Payment processing
│   ├── handlers_social.go   # Social payment features
│   └── handlers_ewa.go      # EWA functionality
├── internal/
│   ├── core/            # Business logic layer
│   │   ├── service.go   # Main service aggregator
│   │   ├── auth.go      # Authentication service
│   │   ├── payments.go  # Payment processing
│   │   ├── social.go    # Social features
│   │   └── ewa.go       # EWA business logic
│   ├── adapters/        # External service adapters
│   │   ├── db/          # Database operations
│   │   ├── paystack/    # Paystack integration
│   │   ├── circle/      # Circle USDC integration
│   │   └── solana/      # Solana blockchain
│   └── middleware/      # HTTP middleware
└── pkg/config/          # Configuration management
```

**Service Pattern:**
- **Dependency Injection**: Core service aggregates all business logic
- **Clean Architecture**: Separation of concerns with clear boundaries
- **Error Handling**: Structured error responses with proper HTTP codes
- **Validation**: Request validation with custom validators
- **Logging**: Structured logging with correlation IDs

#### MCP Server (Go - JSON-RPC)
**AI Integration Layer:**
- **Protocol**: Model Context Protocol for AI agent communication
- **Tools**: 13 specialized tools for business operations
- **Authentication**: API key-based security
- **Rate Limiting**: Per-tool usage limits
- **Monitoring**: Tool usage analytics and performance metrics

### Data Layer

#### PostgreSQL (Port 5432)
**Multi-Schema Architecture:**

```sql
-- Core application data
public schema:
├── users                 # User accounts and profiles
├── organizations        # Multi-tenant organization data
├── api_keys            # Partner API authentication
└── system_config       # Application configuration

-- Identity and authentication
identity schema:
├── auth_sessions       # User sessions and tokens
├── password_resets     # Password reset tokens
├── two_factor_auth     # 2FA configurations
└── audit_logs         # Security audit trail

-- Payment processing
payments schema:
├── transactions        # All payment transactions
├── ledger_entries     # Double-entry accounting
├── payment_methods    # Stored payment methods
├── webhooks           # Webhook delivery logs
└── reconciliation     # Payment reconciliation data

-- Earned Wage Access
ewa schema:
├── employee_profiles   # Employee information
├── payroll_data       # Imported payroll information
├── advance_requests   # Wage advance requests
├── advance_approvals  # Approval workflow data
└── repayment_schedules # Automatic repayment tracking

-- Social payments
social_payments schema:
├── goals              # Crowdfunding goals
├── goal_contributions # Individual contributions
├── split_payments     # Expense splitting
├── payment_templates  # Reusable payment templates
└── social_connections # User relationships
```

**Database Features:**
- **ACID Compliance**: Full transaction support
- **Row Level Security**: Multi-tenant data isolation
- **Indexing Strategy**: Optimized for query performance
- **Backup Strategy**: Continuous WAL archiving with point-in-time recovery
- **Monitoring**: Query performance and connection pooling

#### Redis (Port 6379)
**Caching and Session Management:**
- **Session Storage**: User authentication sessions
- **Rate Limiting**: API rate limit counters
- **Cache Layer**: Frequently accessed data caching
- **Pub/Sub**: Real-time notifications
- **Queue Management**: Background job processing

**Data Structures:**
```redis
# Session management
session:{user_id} -> {session_data}

# Rate limiting
rate_limit:{endpoint}:{user_id} -> {request_count}

# Caching
cache:user:{user_id} -> {user_data}
cache:balance:{account_id} -> {balance_data}

# Real-time features
notifications:{user_id} -> {notification_queue}
```

### Blockchain Integration

#### Solana Network
**Smart Contract Architecture:**
```
contracts/corridor_solana_contracts/
├── programs/
│   ├── ewa_program/        # Earned Wage Access logic
│   │   ├── lib.rs         # Main program entry
│   │   ├── instructions/  # Program instructions
│   │   └── state/         # Account state definitions
│   └── payroll_escrow/    # Payroll escrow management
└── target/                # Compiled programs
```

**Integration Features:**
- **USDC Payments**: Circle USDC integration for stablecoin transactions
- **SOL Payments**: Native Solana token support
- **Smart Contracts**: Custom programs for EWA and payroll escrow
- **Wallet Integration**: Non-custodial wallet services
- **Transaction Monitoring**: Real-time blockchain event processing

## 🔒 Security Architecture

### Authentication & Authorization
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Login    │───▶│  JWT Validation │───▶│ Role-Based      │
│                 │    │                 │    │ Access Control  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   2FA Support   │    │ Session Storage │    │ Permission      │
│                 │    │    (Redis)      │    │ Validation      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Security Layers:**
1. **Transport Security**: TLS 1.3 encryption for all communications
2. **Authentication**: JWT tokens with refresh token rotation
3. **Authorization**: Role-based access control (RBAC)
4. **Data Encryption**: AES-256 encryption for sensitive data at rest
5. **API Security**: Rate limiting, input validation, and CORS protection
6. **Audit Logging**: Comprehensive security event logging

### Payment Security
- **PCI DSS Compliance**: Level 1 merchant compliance
- **Tokenization**: Credit card data tokenization
- **Fraud Detection**: ML-based fraud prevention
- **3D Secure**: Enhanced authentication for card payments
- **Webhook Security**: HMAC signature verification

## 📊 Monitoring & Observability

### Application Monitoring
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │───▶│    Grafana      │───▶│   Alerting      │
│   (Metrics)     │    │  (Dashboards)   │    │   (PagerDuty)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Jaeger        │    │  ELK Stack      │    │   Health        │
│  (Tracing)      │    │   (Logs)        │    │   Checks        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Key Metrics:**
- **Application Performance**: Response times, throughput, error rates
- **Business Metrics**: Transaction volumes, user engagement, revenue
- **Infrastructure**: CPU, memory, disk usage, network performance
- **Security**: Failed login attempts, API abuse, suspicious activities

### Logging Strategy
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Log Aggregation**: Centralized logging with ELK stack
- **Log Retention**: 90 days for application logs, 7 years for financial data

## 🌐 Scalability Considerations

### Horizontal Scaling
- **Stateless Services**: All services designed for horizontal scaling
- **Load Balancing**: Multiple backend instances with health checks
- **Database Scaling**: Read replicas and connection pooling
- **Cache Scaling**: Redis cluster for high availability

### Performance Optimization
- **CDN Integration**: Static asset delivery via CloudFlare
- **Database Optimization**: Query optimization and indexing
- **Caching Strategy**: Multi-layer caching (Redis, application, CDN)
- **Async Processing**: Background jobs for heavy operations

### Global Deployment
- **Multi-Region**: Deployment across multiple AWS regions
- **Data Residency**: Compliance with local data protection laws
- **Edge Computing**: Regional API gateways for reduced latency
- **Disaster Recovery**: Cross-region backup and failover

## 🔧 Development & Deployment

### CI/CD Pipeline
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Push      │───▶│  GitHub Actions │───▶│   Build &       │
│                 │    │                 │    │   Test          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Security      │    │   Docker        │    │   Deploy        │
│   Scanning      │    │   Build         │    │   (Staging)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │   Production    │
                                            │   Deploy        │
                                            └─────────────────┘
```

### Infrastructure as Code
- **Terraform**: Infrastructure provisioning and management
- **Docker**: Containerization for consistent deployments
- **Kubernetes**: Container orchestration for production
- **Helm Charts**: Application deployment templates

---

*This architecture supports Corridor's mission to provide a scalable, secure, and globally accessible business orchestration platform.*