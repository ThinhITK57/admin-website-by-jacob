"""User repository - data access for User model."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from admin_crm.db.models.user import User
from admin_crm.db.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> User | None:
        """Get a user by email address."""
        query = (
            select(User)
            .where(User.email == email)
            .where(User.deleted_at.is_(None))
            .options(selectinload(User.roles), selectinload(User.team))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_id_with_relations(self, id: int) -> User | None:
        """Get user by ID with roles and team eagerly loaded."""
        query = (
            select(User)
            .where(User.id == id)
            .where(User.deleted_at.is_(None))
            .options(selectinload(User.roles), selectinload(User.team))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_users_by_team(self, team_id: int) -> list[User]:
        """Get all users in a specific team."""
        query = (
            select(User)
            .where(User.team_id == team_id)
            .where(User.deleted_at.is_(None))
            .order_by(User.name.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def email_exists(self, email: str, exclude_id: int | None = None) -> bool:
        """Check if email is already taken, optionally excluding a specific user."""
        from sqlalchemy import func

        query = (
            select(func.count())
            .select_from(User)
            .where(User.email == email)
            .where(User.deleted_at.is_(None))
        )
        if exclude_id:
            query = query.where(User.id != exclude_id)

        result = await self.session.execute(query)
        count = result.scalar() or 0
        return count > 0
