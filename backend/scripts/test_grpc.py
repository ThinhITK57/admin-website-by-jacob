"""Quick test script to verify gRPC services are working."""

import sys
import os
import asyncio
from pathlib import Path

# Add paths
backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir / "src"))
sys.path.insert(0, str(backend_dir / "generated"))

import grpc.aio
import user_pb2
import user_pb2_grpc
import common_pb2


async def test_login():
    """Test UserService.Login RPC."""
    print("=" * 50)
    print("TEST 1: Login")
    print("=" * 50)
    
    async with grpc.aio.insecure_channel("localhost:50051") as channel:
        stub = user_pb2_grpc.UserServiceStub(channel)
        
        try:
            request = user_pb2.LoginRequest(
                email="admin@company.vn",
                password="password"
            )
            response = await stub.Login(request)
            print(f"[OK] Login successful!")
            print(f"  Access Token: {response.access_token[:50]}...")
            print(f"  User: {response.user.name} ({response.user.email})")
            print(f"  Roles: {[r.name for r in response.user.roles]}")
            return response.access_token
        except grpc.aio.AioRpcError as e:
            print(f"[FAIL] Login failed: {e.code()} - {e.details()}")
            return None


async def test_list_users(token: str):
    """Test UserService.ListUsers RPC (requires auth)."""
    print()
    print("=" * 50)
    print("TEST 2: ListUsers (authenticated)")
    print("=" * 50)
    
    async with grpc.aio.insecure_channel("localhost:50051") as channel:
        stub = user_pb2_grpc.UserServiceStub(channel)
        
        metadata = [("authorization", f"Bearer {token}")]
        
        try:
            request = common_pb2.ListFilter(
                pagination=common_pb2.PaginationRequest(page=1, page_size=20)
            )
            response = await stub.ListUsers(request, metadata=metadata)
            print(f"[OK] ListUsers successful!")
            print(f"  Total users: {response.pagination.total}")
            for u in response.users:
                roles = [r.name for r in u.roles]
                print(f"  - {u.name} ({u.email}) | Roles: {roles} | Status: {u.status}")
        except grpc.aio.AioRpcError as e:
            print(f"[FAIL] ListUsers failed: {e.code()} - {e.details()}")


async def test_create_user(token: str):
    """Test UserService.CreateUser RPC."""
    print()
    print("=" * 50)
    print("TEST 3: CreateUser (authenticated)")
    print("=" * 50)
    
    async with grpc.aio.insecure_channel("localhost:50051") as channel:
        stub = user_pb2_grpc.UserServiceStub(channel)
        
        metadata = [("authorization", f"Bearer {token}")]
        
        try:
            import time
            unique_email = f"test.user.{int(time.time())}@company.vn"
            request = user_pb2.CreateUserRequest(
                name="Test User",
                email=unique_email,
                password="test123",
                phone="0900000099",
            )
            response = await stub.CreateUser(request, metadata=metadata)
            print(f"[OK] CreateUser successful!")
            print(f"  ID: {response.id}")
            print(f"  Name: {response.name}")
            print(f"  Email: {response.email}")
            return response.id
        except grpc.aio.AioRpcError as e:
            print(f"[FAIL] CreateUser failed: {e.code()} - {e.details()}")
            return None


async def test_delete_user(token: str, user_id: int):
    """Test UserService.DeleteUser RPC."""
    print()
    print("=" * 50)
    print(f"TEST 4: DeleteUser (id={user_id})")
    print("=" * 50)
    
    async with grpc.aio.insecure_channel("localhost:50051") as channel:
        stub = user_pb2_grpc.UserServiceStub(channel)
        
        metadata = [("authorization", f"Bearer {token}")]
        
        try:
            request = common_pb2.IdRequest(id=user_id)
            response = await stub.DeleteUser(request, metadata=metadata)
            print(f"[OK] DeleteUser successful!")
            print(f"  Success: {response.success}")
            print(f"  Message: {response.message}")
        except grpc.aio.AioRpcError as e:
            print(f"[FAIL] DeleteUser failed: {e.code()} - {e.details()}")


async def main():
    print("Admin CRM - Backend gRPC Verification")
    print("=" * 50)
    print()
    
    # Test 1: Login
    token = await test_login()
    if not token:
        print("\nCannot proceed without auth token. Aborting.")
        return
    
    # Test 2: List Users
    await test_list_users(token)
    
    # Test 3: Create User
    new_user_id = await test_create_user(token)
    
    # Test 4: Delete the created user
    if new_user_id:
        await test_delete_user(token, new_user_id)
    
    # Final: List again to confirm
    print()
    print("=" * 50)
    print("FINAL: ListUsers after Create+Delete")
    print("=" * 50)
    await test_list_users(token)
    
    print()
    print("=" * 50)
    print("ALL TESTS COMPLETED!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
