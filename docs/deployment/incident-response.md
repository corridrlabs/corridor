# Incident Response Playbook

## Overview

This playbook provides step-by-step procedures for responding to production incidents in the Corridor platform.

## Incident Classification

### Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 - Critical** | Complete service outage | 15 minutes | Database down, payment processing stopped |
| **P1 - High** | Major feature unavailable | 1 hour | Login issues, payment delays |
| **P2 - Medium** | Minor feature issues | 4 hours | UI bugs, slow response times |
| **P3 - Low** | Cosmetic issues | 24 hours | Typos, minor UI inconsistencies |

## Incident Response Team

### Roles & Responsibilities

**Incident Commander**
- Overall incident coordination
- Communication with stakeholders
- Decision making authority
- Post-incident review coordination

**Technical Lead**
- Technical investigation and resolution
- Coordinate with engineering team
- Implement fixes and rollbacks

**Communications Lead**
- Customer communication
- Status page updates
- Internal stakeholder updates

**On-Call Engineer**
- First responder
- Initial triage and assessment
- Escalation to appropriate teams

## Incident Response Process

### 1. Detection & Alert

#### Automated Detection
- Monitoring alerts (Prometheus/Grafana)
- Health check failures
- Error rate spikes
- Performance degradation

#### Manual Detection
- Customer reports
- Support tickets
- Team member observations

### 2. Initial Response (0-15 minutes)

#### On-Call Engineer Actions
1. **Acknowledge the incident**
   ```bash
   # Acknowledge in monitoring system
   # Update incident tracking system
   ```

2. **Initial assessment**
   - Check monitoring dashboards
   - Review recent deployments
   - Assess impact scope

3. **Create incident channel**
   ```
   #incident-YYYY-MM-DD-brief-description
   ```

4. **Page additional team members if P0/P1**

### 3. Investigation & Diagnosis (15-60 minutes)

#### Technical Investigation Checklist
- [ ] Check application logs
- [ ] Review database performance
- [ ] Verify external service status
- [ ] Check infrastructure metrics
- [ ] Review recent changes

#### Common Investigation Commands
```bash
# Check application health
curl -f https://api.corridor.com/health

# Review recent logs
docker logs corridor-api --tail=100

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor system resources
htop
df -h
free -m

# Check Redis status
redis-cli ping
redis-cli info memory
```

### 4. Mitigation & Resolution

#### Immediate Mitigation Options

**Rollback Deployment**
```bash
# Rollback to previous version
kubectl rollout undo deployment/corridor-api

# Verify rollback
kubectl rollout status deployment/corridor-api
```

**Scale Resources**
```bash
# Scale up pods
kubectl scale deployment corridor-api --replicas=5

# Scale database connections
# Update connection pool settings
```

**Circuit Breaker Activation**
```bash
# Disable problematic features
curl -X POST https://api.corridor.com/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"payment_processing": false}'
```

#### Database Issues

**High Connection Count**
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < now() - interval '5 minutes';
```

**Lock Issues**
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Kill blocking queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid IN (SELECT blocking_pid FROM pg_blocking_pids());
```

**Performance Issues**
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Payment Processing Issues

**Paystack Issues**
```bash
# Check Paystack status
curl -H "Authorization: Bearer $PAYSTACK_SECRET_KEY" \
  https://api.paystack.co/transaction/verify/reference

# Switch to backup payment processor
export PAYMENT_PROCESSOR=stripe
```

**Database Transaction Issues**
```sql
-- Check for stuck transactions
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check transaction locks
SELECT * FROM pg_locks WHERE locktype = 'transactionid';
```

### 5. Communication

#### Internal Communication Template
```
🚨 INCIDENT ALERT - P[SEVERITY]

**Issue**: Brief description
**Impact**: What's affected
**Status**: Investigating/Mitigating/Resolved
**ETA**: Expected resolution time
**Incident Commander**: @username
**Updates**: Every 30 minutes or as needed

#incident-channel for updates
```

#### Customer Communication Template
```
We're currently experiencing issues with [affected service]. 
Our team is actively working on a resolution. 

Impact: [Description of customer impact]
Status: [Current status]
ETA: [Expected resolution time]

We'll provide updates every 30 minutes.
```

#### Status Page Updates
- Update status.corridor.com
- Include impact description
- Provide regular updates
- Post resolution notice

### 6. Resolution & Recovery

#### Verification Checklist
- [ ] All monitoring alerts cleared
- [ ] Application health checks passing
- [ ] Key user journeys working
- [ ] Payment processing functional
- [ ] Database performance normal
- [ ] No error spikes in logs

#### Recovery Actions
```bash
# Verify all services
make health-check

# Run smoke tests
./scripts/smoke-tests.sh

# Check key metrics
curl https://api.corridor.com/metrics | grep error_rate
```

## Common Incident Scenarios

### Database Connection Pool Exhaustion

**Symptoms**
- "too many connections" errors
- Slow response times
- Connection timeouts

**Resolution**
```bash
# Immediate: Kill idle connections
psql $DATABASE_URL -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < now() - interval '5 minutes';"

# Long-term: Increase connection pool size
# Update DATABASE_MAX_CONNECTIONS environment variable
```

### Payment Processing Failure

**Symptoms**
- Payment webhook failures
- Transaction status inconsistencies
- Customer payment complaints

**Resolution**
```bash
# Check payment provider status
curl -H "Authorization: Bearer $PAYSTACK_SECRET_KEY" \
  https://api.paystack.co/transaction/verify/latest

# Retry failed payments
./scripts/retry-failed-payments.sh

# Switch to backup processor if needed
export PAYMENT_PROCESSOR=backup
```

### High Memory Usage

**Symptoms**
- OOM kills
- Slow response times
- Container restarts

**Resolution**
```bash
# Check memory usage
docker stats

# Restart high-memory containers
docker-compose restart api

# Scale horizontally
kubectl scale deployment corridor-api --replicas=3
```

### SSL Certificate Expiration

**Symptoms**
- SSL warnings in browsers
- API connection failures
- Webhook delivery failures

**Resolution**
```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/corridor.crt -text -noout | grep "Not After"

# Renew certificate (Let's Encrypt)
certbot renew --nginx

# Update load balancer certificates
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --certificates CertificateArn=$NEW_CERT_ARN
```

## Post-Incident Activities

### Immediate Post-Incident (0-24 hours)

1. **Incident closure**
   - Verify complete resolution
   - Update status page
   - Notify stakeholders

2. **Data collection**
   - Export relevant logs
   - Capture metrics snapshots
   - Document timeline

3. **Customer follow-up**
   - Send resolution notification
   - Address specific customer impacts
   - Provide compensation if needed

### Post-Incident Review (1-7 days)

#### Review Meeting Agenda
1. **Incident timeline**
2. **Root cause analysis**
3. **Response effectiveness**
4. **Action items identification**
5. **Process improvements**

#### 5 Whys Analysis
```
Problem: Payment processing was down for 2 hours

Why 1: Database connection pool was exhausted
Why 2: Sudden spike in user registrations
Why 3: Marketing campaign launched without capacity planning
Why 4: No monitoring alerts for connection pool usage
Why 5: Monitoring setup was incomplete

Root Cause: Inadequate monitoring and capacity planning
```

#### Action Items Template
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| Add connection pool monitoring | DevOps | 2024-01-15 | High |
| Implement auto-scaling | Engineering | 2024-01-20 | High |
| Update runbook procedures | SRE | 2024-01-10 | Medium |

### Documentation Updates

- Update runbooks with new procedures
- Add monitoring for identified gaps
- Improve alerting thresholds
- Update incident response training

## Contact Information

### Escalation Path
1. **On-Call Engineer**: [Phone/Slack]
2. **Engineering Lead**: [Phone/Slack]
3. **Engineering Manager**: [Phone/Slack]
4. **CTO**: [Phone/Slack]

### External Contacts
- **Paystack Support**: support@paystack.com
- **AWS Support**: [Support case system]
- **DNS Provider**: [Support contact]

### Communication Channels
- **Incident Channel**: #incidents
- **Engineering**: #engineering
- **Customer Support**: #support
- **Leadership**: #leadership

## Tools & Resources

### Monitoring & Alerting
- **Grafana**: https://monitoring.corridor.com
- **Prometheus**: https://prometheus.corridor.com
- **Status Page**: https://status.corridor.com

### Documentation
- **Runbooks**: /docs/runbooks/
- **Architecture**: /docs/architecture/
- **API Docs**: https://docs.corridor.com

### Emergency Procedures
- **Rollback Guide**: /docs/deployment/rollback.md
- **Database Recovery**: /docs/deployment/backup-strategy.md
- **Infrastructure Recovery**: /docs/deployment/disaster-recovery.md