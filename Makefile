.PHONY: dev build test clean migrate makemigration seed setup-supabase test-supabase

# Development
dev:
	docker-compose up --build

# Build production images
build:
	docker-compose build

# Run tests
test:
	docker-compose run --rm api pytest

# Clean up
clean:
	docker-compose down -v
	docker system prune -f

# Database migrations
migrate:
	docker-compose run --rm api alembic upgrade head

# Create new migration
makemigration:
	@read -p "Enter migration message: " msg; \
	docker-compose run --rm api alembic revision --autogenerate -m "$$msg"

# Seed database with sample data
seed:
	@echo "Seeding database with demo data..."
	@docker-compose run --rm api python -c "print('Demo data seeding not implemented yet')"

# Install dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Run backend only
backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run frontend only
frontend:
	cd frontend && npm run dev

# Supabase setup
setup-supabase:
	@echo "🚀 Setting up Supabase for Corridor..."
	@echo "📋 Prerequisites checklist:"
	@echo "   1. ✅ Create Supabase project at https://app.supabase.com"
	@echo "   2. ✅ Copy database credentials to .env file"
	@echo "   3. ✅ Copy API keys to .env file"
	@echo ""
	@echo "📖 Follow the setup guide: SUPABASE_SETUP.md"
	@echo "🧪 Then run: make test-supabase"

# Test Supabase configuration
test-supabase:
	@echo "🧪 Testing Supabase configuration..."
	python scripts/test_supabase_setup.py

# Help
help:
	@echo "Available commands:"
	@echo "  dev          - Start development environment with Docker"
	@echo "  build        - Build production Docker images"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean up Docker containers and volumes"
	@echo "  migrate      - Run database migrations"
	@echo "  makemigration - Create new migration"
	@echo "  seed         - Seed database with demo data"
	@echo "  install      - Install dependencies"
	@echo "  backend      - Run backend only (requires dependencies)"
	@echo "  frontend     - Run frontend only (requires dependencies)"
	@echo "  setup-supabase - Show Supabase setup instructions"
	@echo "  test-supabase  - Test Supabase configuration"
