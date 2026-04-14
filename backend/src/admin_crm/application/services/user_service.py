"""User gRPC service implementation - Auth + User CRUD."""

import math

import grpc

try:
    import user_pb2
    import user_pb2_grpc
    import common_pb2
except ImportError:
    user_pb2 = None
    user_pb2_grpc = object
    common_pb2 = None

from admin_crm.config.database import async_session_factory
from admin_crm.db.repositories import RoleRepository, UserRepository
from admin_crm.infrastructure.interceptors import get_current_user, get_current_user_id
from admin_crm.utils.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_expiry_seconds,
    TokenError,
)
from admin_crm.utils.logger import get_logger
from admin_crm.utils.password import hash_password, verify_password

logger = get_logger("user_service")


class UserServiceImpl(user_pb2_grpc.UserServiceServicer if user_pb2_grpc else object):
    """gRPC UserService implementation.

    Handles authentication (login, refresh, logout) and user CRUD operations.
    """

    async def Login(self, request, context):
        """Authenticate a user and return JWT tokens."""
        async with async_session_factory() as session:
            repo = UserRepository(session)
            user = await repo.get_by_email(request.email)

            if not user:
                await context.abort(
                    grpc.StatusCode.UNAUTHENTICATED, "Invalid email or password"
                )
                return

            if not verify_password(request.password, user.password_hash):
                await context.abort(
                    grpc.StatusCode.UNAUTHENTICATED, "Invalid email or password"
                )
                return

            if user.status != "active":
                await context.abort(
                    grpc.StatusCode.PERMISSION_DENIED,
                    f"Account is {user.status}",
                )
                return

            # Generate tokens
            role_names = user.role_names
            access_token = create_access_token(
                user_id=user.id,
                email=user.email,
                roles=role_names,
            )
            refresh_token = create_refresh_token(user_id=user.id)
            await session.commit()

            logger.info("user_login", user_id=user.id, email=user.email)

            return user_pb2.LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=get_token_expiry_seconds(),
                user=self._user_to_proto(user),
            )

    async def RefreshToken(self, request, context):
        """Refresh an access token using a valid refresh token."""
        try:
            payload = decode_token(request.refresh_token)
            if payload.get("type") != "refresh":
                await context.abort(
                    grpc.StatusCode.UNAUTHENTICATED, "Invalid refresh token"
                )
                return

            user_id = int(payload["sub"])

            async with async_session_factory() as session:
                repo = UserRepository(session)
                user = await repo.get_by_id_with_relations(user_id)

                if not user or user.status != "active":
                    await context.abort(
                        grpc.StatusCode.UNAUTHENTICATED, "User not found or inactive"
                    )
                    return

                access_token = create_access_token(
                    user_id=user.id,
                    email=user.email,
                    roles=user.role_names,
                )
                refresh_token = create_refresh_token(user_id=user.id)
                await session.commit()

                return user_pb2.LoginResponse(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_in=get_token_expiry_seconds(),
                    user=self._user_to_proto(user),
                )

        except TokenError as e:
            await context.abort(grpc.StatusCode.UNAUTHENTICATED, str(e))

    async def Logout(self, request, context):
        """Logout the current user (invalidate token - client-side)."""
        # For JWT, logout is primarily client-side (discard token)
        # In production, add token to a blacklist in Redis
        return common_pb2.StatusResponse(success=True, message="Logged out successfully")

    async def ChangePassword(self, request, context):
        """Change the current user's password."""
        user_id = get_current_user_id()
        if not user_id:
            await context.abort(grpc.StatusCode.UNAUTHENTICATED, "Not authenticated")
            return

        async with async_session_factory() as session:
            repo = UserRepository(session)
            user = await repo.get_by_id(user_id)

            if not user:
                await context.abort(grpc.StatusCode.NOT_FOUND, "User not found")
                return

            if not verify_password(request.old_password, user.password_hash):
                await context.abort(
                    grpc.StatusCode.INVALID_ARGUMENT, "Current password is incorrect"
                )
                return

            user.password_hash = hash_password(request.new_password)
            await session.commit()

            logger.info("password_changed", user_id=user_id)
            return common_pb2.StatusResponse(success=True, message="Password changed successfully")

    async def CreateUser(self, request, context):
        """Create a new user."""
        async with async_session_factory() as session:
            repo = UserRepository(session)
            role_repo = RoleRepository(session)

            # Check email uniqueness
            if await repo.email_exists(request.email):
                await context.abort(
                    grpc.StatusCode.ALREADY_EXISTS, "Email already exists"
                )
                return

            # Create user
            user = await repo.create(
                name=request.name,
                email=request.email,
                password_hash=hash_password(request.password),
                phone=request.phone if request.HasField("phone") else None,
                avatar=request.avatar if request.HasField("avatar") else None,
                team_id=request.team_id if request.HasField("team_id") else None,
                created_by=get_current_user_id(),
            )

            # Assign roles
            if request.role_ids:
                await role_repo.assign_roles_to_user(user.id, list(request.role_ids))

            await session.commit()

            # Reload with relations
            user = await repo.get_by_id_with_relations(user.id)
            logger.info("user_created", user_id=user.id, email=user.email)
            return self._user_to_proto(user)

    async def GetUser(self, request, context):
        """Get a user by ID."""
        async with async_session_factory() as session:
            repo = UserRepository(session)
            user = await repo.get_by_id_with_relations(request.id)

            if not user:
                await context.abort(grpc.StatusCode.NOT_FOUND, "User not found")
                return

            return self._user_to_proto(user)

    async def ListUsers(self, request, context):
        """List users with pagination and filtering."""
        async with async_session_factory() as session:
            repo = UserRepository(session)

            page = request.pagination.page if request.pagination.page else 1
            page_size = request.pagination.page_size if request.pagination.page_size else 20
            sort_by = request.pagination.sort_by or "id"
            sort_order = request.pagination.sort_order or "desc"

            # Build filters from request
            filters = {}
            for f in request.filters:
                if f.field == "status":
                    filters["status"] = f.value
                elif f.field == "team_id":
                    filters["team_id"] = int(f.value)

            users, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=sort_by,
                sort_order=sort_order,
                filters=filters,
                search=request.search or None,
                search_fields=["name", "email", "phone"],
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return user_pb2.ListUsersResponse(
                users=[self._user_to_proto(u) for u in users],
                pagination=common_pb2.PaginationResponse(
                    total=total,
                    page=page,
                    page_size=page_size,
                    total_pages=total_pages,
                ),
            )

    async def UpdateUser(self, request, context):
        """Update a user."""
        async with async_session_factory() as session:
            repo = UserRepository(session)
            role_repo = RoleRepository(session)

            user = await repo.get_by_id(request.id)
            if not user:
                await context.abort(grpc.StatusCode.NOT_FOUND, "User not found")
                return

            # Check email uniqueness if changing
            if request.HasField("email") and request.email != user.email:
                if await repo.email_exists(request.email, exclude_id=user.id):
                    await context.abort(
                        grpc.StatusCode.ALREADY_EXISTS, "Email already exists"
                    )
                    return

            # Update fields
            update_data = {}
            for field in ["name", "email", "phone", "avatar", "status"]:
                if request.HasField(field):
                    update_data[field] = getattr(request, field)
            if request.HasField("team_id"):
                update_data["team_id"] = request.team_id

            update_data["updated_by"] = get_current_user_id()

            if update_data:
                await repo.update(request.id, **update_data)

            # Update roles if provided
            if request.role_ids:
                await role_repo.assign_roles_to_user(request.id, list(request.role_ids))

            await session.commit()

            user = await repo.get_by_id_with_relations(request.id)
            logger.info("user_updated", user_id=user.id)
            return self._user_to_proto(user)

    async def DeleteUser(self, request, context):
        """Soft delete a user."""
        async with async_session_factory() as session:
            repo = UserRepository(session)

            success = await repo.soft_delete(request.id)
            if not success:
                await context.abort(grpc.StatusCode.NOT_FOUND, "User not found")
                return

            await session.commit()
            logger.info("user_deleted", user_id=request.id)
            return common_pb2.StatusResponse(success=True, message="User deleted successfully")

    async def GetProfile(self, request, context):
        """Get the current user's profile."""
        user_id = get_current_user_id()
        if not user_id:
            await context.abort(grpc.StatusCode.UNAUTHENTICATED, "Not authenticated")
            return

        async with async_session_factory() as session:
            repo = UserRepository(session)
            user = await repo.get_by_id_with_relations(user_id)

            if not user:
                await context.abort(grpc.StatusCode.NOT_FOUND, "User not found")
                return

            return self._user_to_proto(user)

    async def UpdateProfile(self, request, context):
        """Update the current user's profile."""
        user_id = get_current_user_id()
        if not user_id:
            await context.abort(grpc.StatusCode.UNAUTHENTICATED, "Not authenticated")
            return

        async with async_session_factory() as session:
            repo = UserRepository(session)

            update_data = {}
            if request.HasField("name"):
                update_data["name"] = request.name
            if request.HasField("phone"):
                update_data["phone"] = request.phone
            if request.HasField("avatar"):
                update_data["avatar"] = request.avatar

            if update_data:
                await repo.update(user_id, **update_data)
                await session.commit()

            user = await repo.get_by_id_with_relations(user_id)
            return self._user_to_proto(user)

    @staticmethod
    def _user_to_proto(user) -> "user_pb2.UserResponse":
        """Convert User ORM model to UserResponse proto message."""
        return user_pb2.UserResponse(
            id=user.id,
            name=user.name or "",
            email=user.email or "",
            phone=user.phone or "",
            avatar=user.avatar or "",
            status=user.status or "active",
            team_id=user.team_id if user.team_id else 0,
            team_name=user.team.name if user.team else "",
            roles=[
                user_pb2.RoleInfo(id=r.id, name=r.name)
                for r in (user.roles or [])
            ],
            created_at=user.created_at.isoformat() if user.created_at else "",
            updated_at=user.updated_at.isoformat() if user.updated_at else "",
        )
