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

    async def get_all(self, **kwargs):
        """Override to eagerly load roles and team for all user queries."""
        from sqlalchemy import func, or_

        page = kwargs.get("page", 1)
        page_size = kwargs.get("page_size", 20)
        sort_by = kwargs.get("sort_by", "id")
        sort_order = kwargs.get("sort_order", "desc")
        filters = kwargs.get("filters")
        search = kwargs.get("search")
        search_fields = kwargs.get("search_fields")

        query = (
            select(User)
            .where(User.deleted_at.is_(None))
            .options(selectinload(User.roles), selectinload(User.team))
        )
        count_query = (
            select(func.count())
            .select_from(User)
            .where(User.deleted_at.is_(None))
        )

        if filters:
            for field, value in filters.items():
                if hasattr(User, field) and value is not None:
                    col = getattr(User, field)
                    query = query.where(col == value)
                    count_query = count_query.where(col == value)

        if search and search_fields:
            search_conditions = []
            for field_name in search_fields:
                if hasattr(User, field_name):
                    col = getattr(User, field_name)
                    search_conditions.append(col.ilike(f"%{search}%"))
            if search_conditions:
                query = query.where(or_(*search_conditions))
                count_query = count_query.where(or_(*search_conditions))

        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        if hasattr(User, sort_by):
            sort_col = getattr(User, sort_by)
            query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

        page_size = min(max(page_size, 1), 100)
        page = max(page, 1)
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.session.execute(query)
        records = result.scalars().all()

        return records, total
