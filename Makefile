# =============================================
# Makefile - Admin CRM Platform
# Convenience commands for development
# =============================================

.PHONY: help install proto migrate seed dev test lint clean

help: ## Show this help
	@echo Available commands:
	@echo   make install   - Install dependencies
	@echo   make proto     - Generate gRPC code from proto files
	@echo   make db-up     - Start PostgreSQL + Redis via Docker
	@echo   make db-down   - Stop Docker services
	@echo   make migrate   - Run database migrations
	@echo   make seed      - Seed initial data
	@echo   make dev       - Start development server
	@echo   make test      - Run tests
	@echo   make lint      - Run linter
	@echo   make clean     - Clean generated files

# ---- Setup ----

install: ## Install all dependencies
	cd backend && pip install poetry && poetry install

proto: ## Generate gRPC Python code from proto files
	cd backend && python -m grpc_tools.protoc \
		-Iprotos \
		--python_out=generated \
		--grpc_python_out=generated \
		--pyi_out=generated \
		protos/*.proto
	@echo "" > backend/generated/__init__.py
	@echo "✅ Proto code generated"

# ---- Database ----

db-up: ## Start database services
	docker compose -f docker/docker-compose.yml up -d
	@echo "✅ PostgreSQL: localhost:5432"
	@echo "✅ Redis: localhost:6379"
	@echo "✅ pgAdmin: http://localhost:5050"

db-down: ## Stop database services
	docker compose -f docker/docker-compose.yml down

migrate: ## Run Alembic migrations
	cd backend && alembic upgrade head

seed: ## Seed initial data
	cd backend && python scripts/seed_data.py

# ---- Development ----

dev: ## Start gRPC development server
	cd backend && python -m admin_crm.main

# ---- Frontend ----

frontend-install: ## Install frontend dependencies
	cd frontend && npm install

frontend-dev: ## Start frontend dev server
	cd frontend && npm run dev

# ---- Quality ----

test: ## Run all tests
	cd backend && pytest -v --cov=src/admin_crm

lint: ## Run linter
	cd backend && ruff check src/ tests/
	cd backend && mypy src/admin_crm/

clean: ## Clean generated and cache files
	rm -rf backend/generated/*.py
	rm -rf backend/__pycache__
	find backend -type d -name __pycache__ -exec rm -rf {} +
	find backend -type d -name .pytest_cache -exec rm -rf {} +
