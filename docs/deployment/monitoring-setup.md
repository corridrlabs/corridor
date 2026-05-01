# Monitoring & Observability Setup

## Overview

This guide covers setting up comprehensive monitoring for the Corridor platform including application metrics, infrastructure monitoring, and alerting.

## Application Monitoring

### Health Check Endpoints

The application exposes several health check endpoints:

- `/health` - Basic application health
- `/ready` - Readiness probe (database connectivity)
- `/metrics` - Prometheus metrics

### Prometheus Metrics

Key metrics to monitor:

```
# Request metrics
http_requests_total{method, endpoint, status}
http_request_duration_seconds{method, endpoint}

# Database metrics
db_connections_active
db_connections_idle
db_query_duration_seconds

# Business metrics
user_registrations_total
payments_processed_total
payments_failed_total
```

## Infrastructure Monitoring

### Docker Compose Monitoring Stack

```yaml
# monitoring/docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus_data:
  grafana_data:
```

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'corridor-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

## Database Monitoring

### PostgreSQL Metrics

Use `postgres_exporter` to collect database metrics:

```yaml
postgres-exporter:
  image: prometheuscommunity/postgres-exporter
  environment:
    DATA_SOURCE_NAME: "postgresql://user:password@postgres:5432/corridor?sslmode=disable"
  ports:
    - "9187:9187"
```

Key database metrics:
- Connection count
- Query performance
- Lock waits
- Replication lag
- Disk usage

### Redis Monitoring

Use `redis_exporter` for Redis metrics:

```yaml
redis-exporter:
  image: oliver006/redis_exporter
  environment:
    REDIS_ADDR: "redis://redis:6379"
  ports:
    - "9121:9121"
```

## Alerting Rules

```yaml
# monitoring/alert_rules.yml
groups:
- name: corridor_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"

  - alert: DatabaseDown
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database is down"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
```

## Log Aggregation

### ELK Stack Setup

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"

logstash:
  image: docker.elastic.co/logstash/logstash:8.8.0
  volumes:
    - ./logstash/pipeline:/usr/share/logstash/pipeline
  ports:
    - "5044:5044"

kibana:
  image: docker.elastic.co/kibana/kibana:8.8.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

### Application Logging

Configure structured logging in the application:

```go
// backend/internal/logging/logger.go
package logging

import (
    "github.com/sirupsen/logrus"
)

func SetupLogger() *logrus.Logger {
    logger := logrus.New()
    logger.SetFormatter(&logrus.JSONFormatter{})
    
    level, _ := logrus.ParseLevel(os.Getenv("LOG_LEVEL"))
    logger.SetLevel(level)
    
    return logger
}
```

## Grafana Dashboards

### Key Dashboards to Create

1. **Application Overview**
   - Request rate and latency
   - Error rates
   - Active users
   - Payment volume

2. **Infrastructure Health**
   - CPU and memory usage
   - Disk I/O
   - Network traffic
   - Container health

3. **Database Performance**
   - Query performance
   - Connection pools
   - Lock waits
   - Replication status

4. **Business Metrics**
   - User registrations
   - Payment success rates
   - Revenue metrics
   - Feature usage

## Alerting Channels

### Slack Integration

```yaml
# monitoring/alertmanager.yml
global:
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  slack_configs:
  - channel: '#alerts'
    title: 'Corridor Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

### PagerDuty Integration

```yaml
receivers:
- name: 'pagerduty'
  pagerduty_configs:
  - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
    description: '{{ .GroupLabels.alertname }}'
```

## Performance Monitoring

### Application Performance Monitoring (APM)

Consider integrating with:
- **Sentry** for error tracking
- **New Relic** for APM
- **DataDog** for full-stack monitoring

### Custom Metrics

Implement custom business metrics:

```go
// Prometheus metrics
var (
    paymentsProcessed = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "payments_processed_total",
            Help: "Total number of payments processed",
        },
        []string{"status", "method"},
    )
)
```

## Maintenance

### Regular Tasks

- Review and update alert thresholds monthly
- Clean up old metrics data (retention policy)
- Update monitoring stack components
- Test alerting channels quarterly
- Review dashboard relevance and accuracy

### Capacity Planning

Monitor trends for:
- Database growth
- Request volume
- User growth
- Resource utilization

Set up alerts for capacity thresholds to enable proactive scaling.