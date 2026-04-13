FROM python:3.11-slim

# Môi trường hệ thống
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src

WORKDIR /app

# Cài đặt system dependencies để build thư viện
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Poetry
RUN pip install -U pip && pip install poetry==1.8.2
RUN poetry config virtualenvs.create false

# Copy file requirements
COPY pyproject.toml poetry.lock* ./

# Cài đặt thư viện Python (không cài root package)
RUN poetry install --only main --no-root --no-interaction

# Copy toàn bộ mã nguồn
COPY . .

# Biên dịch grpc protos
RUN python -m grpc_tools.protoc -I protos --python_out=src --grpc_python_out=src protos/*.proto

# Port gRPC
EXPOSE 50051

# Lệnh khởi chạy
CMD ["python", "src/admin_crm/main.py"]
