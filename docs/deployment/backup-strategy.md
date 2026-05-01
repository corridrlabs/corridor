# Backup & Disaster Recovery Strategy

## Overview

This document outlines the backup and disaster recovery procedures for the Corridor platform to ensure business continuity and data protection.

## Backup Strategy

### Database Backups

#### PostgreSQL Automated Backups

**Daily Full Backups**
```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="corridor"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/corridor_full_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/corridor_full_$DATE.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/corridor_full_$DATE.sql.gz" s3://corridor-backups/postgresql/

# Clean up local files older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: corridor_full_$DATE.sql.gz"
```

**Hourly Incremental Backups**
```bash
#!/bin/bash
# scripts/backup-incremental.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql/incremental"

# WAL archiving for point-in-time recovery
pg_basebackup -D "$BACKUP_DIR/base_$DATE" -Ft -z -P

# Upload to S3
aws s3 sync "$BACKUP_DIR/base_$DATE" s3://corridor-backups/postgresql/incremental/base_$DATE/
```

#### Backup Automation with Cron

```bash
# Add to crontab
0 2 * * * /scripts/backup-db.sh >> /var/log/backup.log 2>&1
0 */1 * * * /scripts/backup-incremental.sh >> /var/log/backup-incremental.log 2>&1
```

### Redis Backups

```bash
#!/bin/bash
# scripts/backup-redis.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/redis"

# Create backup directory
mkdir -p $BACKUP_DIR

# Redis backup
redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Compress and upload
gzip "$BACKUP_DIR/redis_$DATE.rdb"
aws s3 cp "$BACKUP_DIR/redis_$DATE.rdb.gz" s3://corridor-backups/redis/

# Clean up old backups
find $BACKUP_DIR -name "*.rdb.gz" -mtime +3 -delete
```

### Application Data Backups

#### File System Backups
```bash
#!/bin/bash
# scripts/backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/files"

# Backup uploaded files, logs, and configurations
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" \
    /app/uploads \
    /app/logs \
    /app/config

# Upload to S3
aws s3 cp "$BACKUP_DIR/files_$DATE.tar.gz" s3://corridor-backups/files/

# Clean up
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Backup Verification

### Automated Backup Testing

```bash
#!/bin/bash
# scripts/test-backup.sh

LATEST_BACKUP=$(aws s3 ls s3://corridor-backups/postgresql/ | sort | tail -n 1 | awk '{print $4}')

# Download latest backup
aws s3 cp "s3://corridor-backups/postgresql/$LATEST_BACKUP" /tmp/

# Test restore to temporary database
createdb corridor_test_restore
gunzip -c "/tmp/$LATEST_BACKUP" | psql corridor_test_restore

# Verify data integrity
psql corridor_test_restore -c "SELECT COUNT(*) FROM users;"
psql corridor_test_restore -c "SELECT COUNT(*) FROM transactions;"

# Clean up
dropdb corridor_test_restore
rm "/tmp/$LATEST_BACKUP"

echo "Backup verification completed for $LATEST_BACKUP"
```

## Disaster Recovery Procedures

### Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Component | RTO | RPO | Recovery Method |
|-----------|-----|-----|-----------------|
| Database | 30 minutes | 1 hour | Automated restore from S3 |
| Application | 15 minutes | 0 minutes | Container redeployment |
| Redis Cache | 5 minutes | 1 hour | Rebuild from database |
| File Storage | 1 hour | 24 hours | S3 restore |

### Database Recovery

#### Full Database Restore
```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Download backup from S3
aws s3 cp "s3://corridor-backups/postgresql/$BACKUP_FILE" /tmp/

# Stop application to prevent new connections
docker-compose stop api

# Drop and recreate database
dropdb corridor
createdb corridor

# Restore from backup
gunzip -c "/tmp/$BACKUP_FILE" | psql corridor

# Restart application
docker-compose start api

echo "Database restored from $BACKUP_FILE"
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# scripts/restore-pitr.sh

TARGET_TIME=$1
if [ -z "$TARGET_TIME" ]; then
    echo "Usage: $0 'YYYY-MM-DD HH:MM:SS'"
    exit 1
fi

# Stop PostgreSQL
systemctl stop postgresql

# Restore base backup
LATEST_BASE=$(aws s3 ls s3://corridor-backups/postgresql/incremental/ | sort | tail -n 1 | awk '{print $2}')
aws s3 sync "s3://corridor-backups/postgresql/incremental/$LATEST_BASE" /var/lib/postgresql/data/

# Configure recovery
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'aws s3 cp s3://corridor-backups/postgresql/wal/%f %p'
recovery_target_time = '$TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL
systemctl start postgresql
```

### Application Recovery

#### Container Recovery
```bash
#!/bin/bash
# scripts/recover-application.sh

echo "Starting application recovery..."

# Pull latest images
docker-compose pull

# Start services in order
docker-compose up -d db redis
sleep 30

docker-compose up -d api
sleep 15

docker-compose up -d frontend api-gateway

# Verify services
make health-check

echo "Application recovery completed"
```

### Infrastructure Recovery

#### AWS Infrastructure Recovery
```bash
#!/bin/bash
# scripts/recover-infrastructure.sh

# Recreate infrastructure using Terraform
cd deployment/terraform
terraform init
terraform plan -var-file="production.tfvars"
terraform apply -auto-approve

# Wait for RDS to be available
aws rds wait db-instance-available --db-instance-identifier corridor-db

# Restore database
./scripts/restore-db.sh $LATEST_BACKUP

# Deploy application
make deploy-prod
```

## Monitoring & Alerting

### Backup Monitoring

```yaml
# monitoring/backup-alerts.yml
groups:
- name: backup_alerts
  rules:
  - alert: BackupFailed
    expr: time() - backup_last_success_timestamp > 86400
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Database backup has not succeeded in 24 hours"

  - alert: BackupVerificationFailed
    expr: backup_verification_success == 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Backup verification failed"
```

### Backup Metrics

```go
// Prometheus metrics for backup monitoring
var (
    backupDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "backup_duration_seconds",
            Help: "Time taken to complete backup",
        },
        []string{"type"},
    )
    
    backupSuccess = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "backup_last_success_timestamp",
            Help: "Timestamp of last successful backup",
        },
        []string{"type"},
    )
)
```

## Security Considerations

### Backup Encryption

```bash
# Encrypt backups before uploading
gpg --cipher-algo AES256 --compress-algo 1 --s2k-cipher-algo AES256 \
    --s2k-digest-algo SHA512 --s2k-mode 3 --s2k-count 65536 \
    --symmetric --output backup_encrypted.gpg backup.sql
```

### Access Control

- Backup S3 bucket with restricted IAM policies
- Separate backup encryption keys
- Audit trail for backup access
- Regular access review

### Compliance

- Retain backups according to regulatory requirements
- Document backup procedures for audits
- Test recovery procedures quarterly
- Maintain backup logs for compliance

## Testing & Validation

### Monthly Recovery Drills

1. **Database Recovery Test**
   - Restore to test environment
   - Verify data integrity
   - Test application functionality

2. **Full System Recovery Test**
   - Complete infrastructure rebuild
   - Application deployment
   - End-to-end testing

3. **Documentation Review**
   - Update procedures based on test results
   - Review RTO/RPO targets
   - Update contact information

### Backup Validation Checklist

- [ ] Backup files are created successfully
- [ ] Backup files are uploaded to S3
- [ ] Backup verification tests pass
- [ ] Recovery procedures are documented
- [ ] Team is trained on recovery procedures
- [ ] Monitoring alerts are configured
- [ ] Compliance requirements are met