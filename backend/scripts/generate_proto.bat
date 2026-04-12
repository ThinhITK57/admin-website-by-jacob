@echo off
REM =============================================
REM Generate gRPC Python code from .proto files
REM =============================================

echo 🔄 Generating gRPC code from proto files...

set PROTO_DIR=protos
set OUT_DIR=generated

REM Create output directory
if not exist %OUT_DIR% mkdir %OUT_DIR%

REM Generate for each proto file
for %%f in (%PROTO_DIR%\*.proto) do (
    echo   Processing: %%f
    python -m grpc_tools.protoc ^
        -I%PROTO_DIR% ^
        --python_out=%OUT_DIR% ^
        --grpc_python_out=%OUT_DIR% ^
        --pyi_out=%OUT_DIR% ^
        %%f
)

REM Create __init__.py
echo. > %OUT_DIR%\__init__.py

echo ✅ gRPC code generated in %OUT_DIR%/
