# Admin CRM Platform – Mini CRM for Sale & Marketing

> Admin Platform trung tâm dùng để quản lý người dùng, phân quyền (RBAC), và tích hợp các module vận hành (Telesale, Marketing/Ads).

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11+ / gRPC (asyncio) / SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 / Redis 7 |
| **Frontend** | Next.js 15 (App Router) / TypeScript / Tailwind CSS / shadcn/ui |
| **Auth** | JWT (access + refresh tokens) |
| **RBAC** | Custom role-based via gRPC interceptors |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose

### 1. Start databases
```bash
make db-up
```

### 2. Install backend
```bash
make install
```

### 3. Generate gRPC code
```bash
make proto
```

### 4. Seed data
```bash
make seed
```

### 5. Start backend
```bash
make dev
```

### 6. Start frontend
```bash
make frontend-install
make frontend-dev
```

## 📋 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@company.vn | password |
| Leader Sale | leader.sale@company.vn | password |
| Nhân viên Sale | sale1@company.vn | password |
| Nhân viên Ads | ads@company.vn | password |

## 📂 Project Structure

```
├── backend/               # Python gRPC Backend
│   ├── protos/            # Protocol Buffer definitions
│   ├── generated/         # Auto-generated gRPC code
│   ├── src/admin_crm/     # Application source
│   │   ├── config/        # Settings & database config
│   │   ├── db/models/     # SQLAlchemy ORM models
│   │   ├── db/repos/      # Repository pattern (data access)
│   │   ├── application/   # gRPC service implementations
│   │   ├── infrastructure/# Interceptors (auth, RBAC, logging)
│   │   └── utils/         # JWT, password, logger
│   ├── scripts/           # Seed data, proto generation
│   └── tests/             # Unit + Integration tests
├── frontend/              # Next.js 15 Frontend
│   ├── src/app/           # App Router pages
│   ├── src/components/    # Reusable UI components
│   └── src/lib/           # API client & utilities
├── docker/                # Docker Compose (PostgreSQL + Redis)
└── Makefile               # Development commands
```

## 📖 License

Private – Internal Use Only
