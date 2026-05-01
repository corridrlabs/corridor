#!/bin/bash

set -e

ENVIRONMENT=${1:-development}
DRY_RUN=${2:-false}

echo "🗄️ Running database migrations for $ENVIRONMENT environment"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  PRODUCTION MIGRATION - Proceeding with caution..."
    read -p "Are you sure you want to run migrations on production? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Migration cancelled"
        exit 1
    fi
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | xargs)
else
    echo "❌ No environment file found"
    exit 1
fi

# Check database connection
echo "🔍 Testing database connection..."
if ! pg_isready -h $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1) > /dev/null 2>&1; then
    echo "❌ Cannot connect to database"
    exit 1
fi

# Backup database (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "💾 Creating database backup..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump $DATABASE_URL > "backups/$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
fi

# Run migrations
if [ "$DRY_RUN" = "true" ]; then
    echo "🧪 DRY RUN - Showing pending migrations..."
    # Add your migration tool's dry-run command here
    echo "Migrations would be applied here"
else
    echo "🚀 Applying migrations..."
    
    # For Go migrations (using golang-migrate)
    if command -v migrate &> /dev/null; then
        migrate -path backend/migrations -database $DATABASE_URL up
    # For Alembic (Python)
    elif command -v alembic &> /dev/null; then
        cd backend && alembic upgrade head
    # For Docker-based migrations
    else
        docker-compose run --rm api alembic upgrade head
    fi
    
    echo "✅ Migrations completed successfully"
fi

# Verify migration status
echo "📊 Current migration status:"
# Add command to show current migration version

echo "✅ Migration process completed!"