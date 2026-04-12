**✅ CẤU TRÚC THƯ MỤC CHUẨN NHẤT cho dự án Python + gRPC (Admin Platform Mini CRM)**

Dưới đây là cấu trúc **production-grade**, được tối ưu cho:
- Python 3.11+
- gRPC (asyncio)
- SQLAlchemy 2.0 + Alembic
- PostgreSQL
- RBAC (Casbin hoặc custom)
- Dễ scale thành microservices sau này
- Clean Architecture (Domain + Application + Infrastructure)

```bash
admin-crm-platform/                  # Tên project (root)
├── protos/                          # TẤT CẢ FILE .proto (quan trọng nhất)
│   ├── user.proto
│   ├── role.proto
│   ├── permission.proto
│   ├── sale.proto                   # Telesale module
│   ├── lead.proto
│   ├── call.proto
│   ├── campaign.proto               # Ads/Marketing module
│   ├── dashboard.proto
│   └── common.proto                 # Shared messages (Pagination, Response, etc.)
│
├── generated/                       # CODE TỰ ĐỘNG SINH TỪ PROTO (KHÔNG CHỈNH SỬA TAY)
│   ├── user_pb2.py
│   ├── user_pb2_grpc.py
│   ├── sale_pb2.py
│   └── ...                          # Tạo bằng script: python -m grpc_tools.protoc
│
├── src/
│   └── admin_crm/                   # Package chính (tên giống project)
│       ├── __init__.py
│       ├── __version__.py
│       │
│       ├── config/                  # Cấu hình & Environment
│       │   ├── __init__.py
│       │   ├── settings.py          # Pydantic Settings (BaseSettings)
│       │   └── database.py          # SQLAlchemy engine, async session
│       │
│       ├── db/                      # Database layer
│       │   ├── __init__.py
│       │   ├── models/              # SQLAlchemy ORM models (User, Role, Lead...)
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   ├── user.py
│       │   │   ├── role.py
│       │   │   ├── lead.py
│       │   │   └── ...
│       │   ├── repositories/        # Repository pattern (Data Access)
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   ├── user_repository.py
│       │   │   ├── lead_repository.py
│       │   │   └── ...
│       │   └── migrations/          # Alembic migrations (tự động tạo)
│       │       ├── versions/
│       │       └── env.py
│       │
│       ├── domain/                  # Business entities (nếu dùng DDD)
│       │   └── entities/
│       │
│       ├── application/             # Application services (logic chính)
│       │   ├── services/            # gRPC Service Implementations
│       │   │   ├── user_service.py
│       │   │   ├── role_service.py
│       │   │   ├── sale_service.py
│       │   │   ├── campaign_service.py
│       │   │   └── ...
│       │   └── use_cases/           # Optional: Clean Use Cases
│       │
│       ├── infrastructure/          # Infrastructure (gRPC, Auth, External)
│       │   ├── interceptors/        # gRPC Interceptors
│       │   │   ├── auth_interceptor.py
│       │   │   ├── rbac_interceptor.py
│       │   │   └── logging_interceptor.py
│       │   ├── casbin/              # RBAC (policy + model)
│       │   │   ├── model.conf
│       │   │   └── policy.csv
│       │   └── grpc_server.py       # Server setup + interceptor registration
│       │
│       ├── schemas/                 # Pydantic models (nếu cần validate ngoài proto)
│       │   └── ...
│       │
│       ├── utils/                   # Helpers
│       │   ├── jwt.py
│       │   ├── password.py
│       │   ├── logger.py
│       │   └── ...
│       │
│       ├── main.py                  # Entry point: start gRPC server
│       └── server.py                # Async server factory
│
├── tests/                           # Test đầy đủ
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── conftest.py
│
├── scripts/                         # Script hỗ trợ dev
│   ├── seed_data.py                 # Python script seed (chạy sau khi migrate)
│   ├── generate_proto.sh            # Tự động generate gRPC code
│   ├── reset_db.sh
│   └── backup_db.sh
│
├── docker/                          # Docker & Docker Compose
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx/                       # (nếu có API Gateway sau này)
│
├── alembic.ini                      # Alembic config
├── pyproject.toml                   # Hoặc requirements.txt + setup.cfg
├── .env.example
├── .gitignore
├── README.md
├── Makefile                         # Command tiện ích: make migrate, make seed...
└── LICENSE
```

### Tại sao cấu trúc này là **chuẩn nhất**?

| Phần | Lý do |
|------|------|
| `protos/` | Tách biệt hoàn toàn định nghĩa API (contract-first) |
| `generated/` | Không bao giờ chỉnh tay → dễ regenerate |
| `src/admin_crm/` | Flat package, dễ import, theo PEP 420 |
| `db/models` + `repositories` | Repository pattern → dễ test, dễ thay DB sau |
| `infrastructure/interceptors` | gRPC interceptor là cách chuẩn để xử lý Auth + RBAC |
| `application/services` | Mỗi service tương ứng 1 proto service |
| `scripts/` | Dễ chạy seed, migrate trong dev/local |

### Hướng dẫn nhanh khởi tạo

1. Tạo thư mục:
   ```bash
   mkdir -p admin-crm-platform/{protos,generated,src/admin_crm/{config,db/{models,repositories},application/services,infrastructure/{interceptors,casbin},utils},tests,scripts,docker}
   ```

2. Copy cấu trúc trên vào.

Bạn muốn tôi **xuất ngay**:
- File `generate_proto.sh`?
- `pyproject.toml` + dependencies (grpcio, sqlalchemy, casbin, pydantic-settings...)?
- `main.py` + `grpc_server.py` mẫu?
- `Dockerfile` + `docker-compose.yml`?

Reply cụ thể (ví dụ: “xuất pyproject.toml”, “xuất generate_proto.sh”, “xuất main.py”, “xuất Dockerfile”) tôi sẽ sinh liền trong tin nhắn tiếp theo.

Bạn sẵn sàng code chưa? Mình đi tiếp từng phần nhé! 🚀