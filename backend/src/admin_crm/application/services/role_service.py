"""Role gRPC service implementation - RBAC Management."""

import math

import grpc

try:
    import role_pb2
    import role_pb2_grpc
    import common_pb2
except ImportError:
    role_pb2 = None
    role_pb2_grpc = object
    common_pb2 = None

from sqlalchemy.orm import selectinload
from admin_crm.db.models.role import Role
from admin_crm.config.database import async_session_factory
from admin_crm.db.repositories import PermissionRepository, RoleRepository
from admin_crm.infrastructure.interceptors import get_current_user_id
from admin_crm.utils.logger import get_logger

logger = get_logger("role_service")


class RoleServiceImpl(role_pb2_grpc.RoleServiceServicer if role_pb2_grpc != object else object):
    """gRPC RoleService implementation for RBAC management."""

    async def CreateRole(self, request, context):
        """Create a new role."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)

            existing = await repo.get_by_name(request.name)
            if existing:
                await context.abort(
                    grpc.StatusCode.ALREADY_EXISTS,
                    f"Role '{request.name}' already exists",
                )
                return

            role = await repo.create(
                name=request.name,
                description=request.description if request.HasField("description") else None,
                created_by=get_current_user_id(),
            )

            if request.permission_ids:
                await repo.assign_permissions(role.id, list(request.permission_ids))

            await session.commit()
            role = await repo.get_with_permissions(role.id)
            logger.info("role_created", role_id=role.id, name=role.name)
            return self._role_to_proto(role)

    async def GetRole(self, request, context):
        """Get a role by ID with permissions."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)
            role = await repo.get_with_permissions(request.id)

            if not role:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Role not found")
                return

            return self._role_to_proto(role)

    async def ListRoles(self, request, context):
        """List all roles with pagination."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)

            page = request.pagination.page if request.pagination.page else 1
            page_size = request.pagination.page_size if request.pagination.page_size else 50
            sort_by = request.pagination.sort_by or "id"
            sort_order = request.pagination.sort_order or "asc"

            roles, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=sort_by,
                sort_order=sort_order,
                search=request.search or None,
                search_fields=["name", "description"],
                options=[selectinload(Role.permissions)],
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return role_pb2.ListRolesResponse(
                roles=[self._role_to_proto(r) for r in roles],
                pagination=common_pb2.PaginationResponse(
                    total=total,
                    page=page,
                    page_size=page_size,
                    total_pages=total_pages,
                ),
            )

    async def UpdateRole(self, request, context):
        """Update a role."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)
            role = await repo.get_by_id(request.id)

            if not role:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Role not found")
                return

            update_data = {}
            if request.HasField("name"):
                update_data["name"] = request.name
            if request.HasField("description"):
                update_data["description"] = request.description

            if update_data:
                await repo.update(request.id, **update_data)

            if request.permission_ids:
                await repo.assign_permissions(request.id, list(request.permission_ids))

            await session.commit()
            role = await repo.get_with_permissions(request.id)
            logger.info("role_updated", role_id=role.id)
            return self._role_to_proto(role)

    async def DeleteRole(self, request, context):
        """Delete a role."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)

            role = await repo.get_by_id(request.id)
            if not role:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Role not found")
                return

            if role.name in ("super_admin", "truong_phong", "leader", "nhan_vien"):
                await context.abort(
                    grpc.StatusCode.FAILED_PRECONDITION,
                    "Cannot delete system roles",
                )
                return

            await repo.hard_delete(request.id)
            await session.commit()
            logger.info("role_deleted", role_id=request.id)
            return common_pb2.StatusResponse(success=True, message="Role deleted successfully")

    async def ListPermissions(self, request, context):
        """List all permissions."""
        async with async_session_factory() as session:
            repo = PermissionRepository(session)

            page = request.pagination.page if request.pagination.page else 1
            page_size = request.pagination.page_size if request.pagination.page_size else 100

            permissions, total = await repo.get_all(
                page=page,
                page_size=page_size,
                search=request.search or None,
                search_fields=["name", "description"],
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return role_pb2.ListPermissionsResponse(
                permissions=[self._perm_to_proto(p) for p in permissions],
                pagination=common_pb2.PaginationResponse(
                    total=total,
                    page=page,
                    page_size=page_size,
                    total_pages=total_pages,
                ),
            )

    async def AssignPermissionsToRole(self, request, context):
        """Assign permissions to a role."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)
            await repo.assign_permissions(
                request.role_id, list(request.permission_ids)
            )
            await session.commit()
            logger.info(
                "permissions_assigned",
                role_id=request.role_id,
                count=len(request.permission_ids),
            )
            return common_pb2.StatusResponse(success=True, message="Permissions assigned successfully")

    async def AssignRolesToUser(self, request, context):
        """Assign roles to a user."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)
            await repo.assign_roles_to_user(
                request.user_id, list(request.role_ids)
            )
            await session.commit()
            logger.info(
                "roles_assigned_to_user",
                user_id=request.user_id,
                count=len(request.role_ids),
            )
            return common_pb2.StatusResponse(success=True, message="Roles assigned successfully")

    async def GetRolePermissions(self, request, context):
        """Get all permissions for a specific role."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)
            role = await repo.get_with_permissions(request.id)

            if not role:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Role not found")
                return

            perms = role.permissions or []
            return role_pb2.ListPermissionsResponse(
                permissions=[self._perm_to_proto(p) for p in perms],
                pagination=common_pb2.PaginationResponse(
                    total=len(perms), page=1, page_size=100, total_pages=1,
                ),
            )

    async def GetUserRoles(self, request, context):
        """Get all roles for a user."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)
            roles = await repo.get_user_roles(request.id)

            return role_pb2.ListRolesResponse(
                roles=[self._role_to_proto(r) for r in roles],
                pagination=common_pb2.PaginationResponse(
                    total=len(roles), page=1, page_size=50, total_pages=1,
                ),
            )

    async def GetUserPermissions(self, request, context):
        """Get all permissions for a user (through their roles)."""
        async with async_session_factory() as session:
            repo = RoleRepository(session)
            permissions = await repo.get_user_permissions(request.id)

            return role_pb2.ListPermissionsResponse(
                permissions=[self._perm_to_proto(p) for p in permissions],
                pagination=common_pb2.PaginationResponse(
                    total=len(permissions), page=1, page_size=100, total_pages=1,
                ),
            )

    @staticmethod
    def _perm_to_proto(p) -> "role_pb2.PermissionResponse":
        return role_pb2.PermissionResponse(
            id=p.id,
            name=p.name or "",
            guard_name=p.guard_name or "web",
            description=p.description or "",
        )

    @staticmethod
    def _role_to_proto(role) -> "role_pb2.RoleResponse":
        """Convert Role model to RoleResponse proto message."""
        return role_pb2.RoleResponse(
            id=role.id,
            name=role.name or "",
            guard_name=role.guard_name or "web",
            description=role.description or "",
            permissions=[
                role_pb2.PermissionResponse(
                    id=p.id,
                    name=p.name or "",
                    guard_name=p.guard_name or "web",
                    description=p.description or "",
                )
                for p in (role.permissions or [])
            ],
            created_at=role.created_at.isoformat() if role.created_at else "",
        )
