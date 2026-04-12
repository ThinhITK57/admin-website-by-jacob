"""Role and Permission repositories."""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from admin_crm.db.models.role import (
    Permission,
    Role,
    model_has_roles,
    role_has_permissions,
)
from admin_crm.db.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    """Repository for Role CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Role, session)

    async def get_by_name(self, name: str) -> Role | None:
        """Get a role by name."""
        query = select(Role).where(Role.name == name).options(selectinload(Role.permissions))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_with_permissions(self, id: int) -> Role | None:
        """Get role with all permissions loaded."""
        query = (
            select(Role)
            .where(Role.id == id)
            .options(selectinload(Role.permissions))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def assign_permissions(self, role_id: int, permission_ids: list[int]) -> None:
        """Replace all permissions for a role."""
        # Remove existing
        await self.session.execute(
            delete(role_has_permissions).where(role_has_permissions.c.role_id == role_id)
        )
        # Insert new
        if permission_ids:
            for pid in permission_ids:
                await self.session.execute(
                    role_has_permissions.insert().values(role_id=role_id, permission_id=pid)
                )
        await self.session.flush()

    async def assign_roles_to_user(self, user_id: int, role_ids: list[int]) -> None:
        """Replace all roles for a user."""
        # Remove existing
        await self.session.execute(
            delete(model_has_roles).where(
                model_has_roles.c.model_id == user_id,
                model_has_roles.c.model_type == "User",
            )
        )
        # Insert new
        if role_ids:
            for rid in role_ids:
                await self.session.execute(
                    model_has_roles.insert().values(
                        role_id=rid, model_id=user_id, model_type="User"
                    )
                )
        await self.session.flush()

    async def get_user_roles(self, user_id: int) -> list[Role]:
        """Get all roles for a user."""
        query = (
            select(Role)
            .join(model_has_roles, Role.id == model_has_roles.c.role_id)
            .where(
                model_has_roles.c.model_id == user_id,
                model_has_roles.c.model_type == "User",
            )
            .options(selectinload(Role.permissions))
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_user_permissions(self, user_id: int) -> list[Permission]:
        """Get all permissions for a user (through their roles)."""
        query = (
            select(Permission)
            .join(role_has_permissions, Permission.id == role_has_permissions.c.permission_id)
            .join(Role, Role.id == role_has_permissions.c.role_id)
            .join(model_has_roles, Role.id == model_has_roles.c.role_id)
            .where(
                model_has_roles.c.model_id == user_id,
                model_has_roles.c.model_type == "User",
            )
            .distinct()
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class PermissionRepository(BaseRepository[Permission]):
    """Repository for Permission CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Permission, session)

    async def get_by_name(self, name: str) -> Permission | None:
        """Get a permission by name."""
        query = select(Permission).where(Permission.name == name)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_ids(self, ids: list[int]) -> list[Permission]:
        """Get multiple permissions by their IDs."""
        query = select(Permission).where(Permission.id.in_(ids))
        result = await self.session.execute(query)
        return list(result.scalars().all())
