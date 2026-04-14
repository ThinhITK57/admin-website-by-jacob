"""Generic async CRUD repository with pagination and soft delete support."""

from typing import Any, Generic, Sequence, TypeVar

from sqlalchemy import Select, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from admin_crm.db.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository providing common async CRUD operations.

    All specific repositories should inherit from this.
    """

    def __init__(self, model: type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, id: int, options: list[Any] | None = None) -> ModelType | None:
        """Get a single record by ID, excluding soft-deleted."""
        query = select(self.model).where(self.model.id == id)
        if hasattr(self.model, "deleted_at"):
            query = query.where(self.model.deleted_at.is_(None))
        
        if options:
            for opt in options:
                query = query.options(opt)
                
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        sort_order: str = "desc",
        filters: dict[str, Any] | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
        options: list[Any] | None = None,
    ) -> tuple[Sequence[ModelType], int]:
        """Get paginated list of records with optional filtering and search.

        Returns:
            Tuple of (records, total_count)
        """
        # Base query excluding soft-deleted
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if hasattr(self.model, "deleted_at"):
            query = query.where(self.model.deleted_at.is_(None))
            count_query = count_query.where(self.model.deleted_at.is_(None))

        # Apply filters
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    col = getattr(self.model, field)
                    query = query.where(col == value)
                    count_query = count_query.where(col == value)

        # Apply search
        if search and search_fields:
            search_conditions = []
            for field_name in search_fields:
                if hasattr(self.model, field_name):
                    col = getattr(self.model, field_name)
                    search_conditions.append(col.ilike(f"%{search}%"))
            if search_conditions:
                from sqlalchemy import or_
                query = query.where(or_(*search_conditions))
                count_query = count_query.where(or_(*search_conditions))

        # Get total count
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # Apply sorting
        if hasattr(self.model, sort_by):
            sort_col = getattr(self.model, sort_by)
            query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

        # Apply eager loading options
        if options:
            for opt in options:
                query = query.options(opt)

        # Apply pagination
        page_size = min(max(page_size, 1), 100)  # Enforce limits
        page = max(page, 1)
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.session.execute(query)
        records = result.scalars().all()

        return records, total

    async def create(self, **kwargs: Any) -> ModelType:
        """Create a new record."""
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, id: int, **kwargs: Any) -> ModelType | None:
        """Update an existing record by ID."""
        instance = await self.get_by_id(id)
        if not instance:
            return None

        for key, value in kwargs.items():
            if hasattr(instance, key) and value is not None:
                setattr(instance, key, value)

        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def soft_delete(self, id: int) -> bool:
        """Soft delete a record by setting deleted_at."""
        from datetime import datetime, timezone

        instance = await self.get_by_id(id)
        if not instance:
            return False

        if hasattr(instance, "deleted_at"):
            instance.deleted_at = datetime.now(timezone.utc)
            await self.session.flush()
            return True
        return False

    async def hard_delete(self, id: int) -> bool:
        """Permanently delete a record."""
        instance = await self.get_by_id(id)
        if not instance:
            return False

        await self.session.delete(instance)
        await self.session.flush()
        return True

    async def exists(self, **kwargs: Any) -> bool:
        """Check if a record exists with given criteria."""
        query = select(func.count()).select_from(self.model)
        for field, value in kwargs.items():
            if hasattr(self.model, field):
                query = query.where(getattr(self.model, field) == value)
        if hasattr(self.model, "deleted_at"):
            query = query.where(self.model.deleted_at.is_(None))
        result = await self.session.execute(query)
        count = result.scalar() or 0
        return count > 0

    def _build_query(self) -> Select:
        """Build base query with soft delete filter. Override for custom joins."""
        query = select(self.model)
        if hasattr(self.model, "deleted_at"):
            query = query.where(self.model.deleted_at.is_(None))
        return query
