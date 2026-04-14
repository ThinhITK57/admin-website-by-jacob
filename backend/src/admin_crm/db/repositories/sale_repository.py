"""Telesale repositories - Lead, Call, SaleStaff, Opportunity, Deal."""

from datetime import date

from sqlalchemy import Date, and_, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from admin_crm.db.models.sale import Call, Deal, Lead, Opportunity, SaleStaff
from admin_crm.db.repositories.base import BaseRepository


class SaleStaffRepository(BaseRepository[SaleStaff]):
    """Repository for SaleStaff operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(SaleStaff, session)

    async def get_by_user_id(self, user_id: int) -> SaleStaff | None:
        query = (
            select(SaleStaff)
            .where(SaleStaff.user_id == user_id)
            .where(SaleStaff.deleted_at.is_(None))
            .options(selectinload(SaleStaff.user))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_id(self, id: int, options=None):
        from admin_crm.db.models.user import User
        opts = options or []
        opts.extend([selectinload(SaleStaff.user).selectinload(User.team)])
        return await super().get_by_id(id, options=opts)

    async def get_all(self, **kwargs):
        from admin_crm.db.models.user import User
        opts = kwargs.get("options", [])
        opts.extend([selectinload(SaleStaff.user).selectinload(User.team)])
        kwargs["options"] = opts
        return await super().get_all(**kwargs)


class LeadRepository(BaseRepository[Lead]):
    """Repository for Lead operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Lead, session)

    async def get_by_phone(self, phone: str) -> Lead | None:
        query = (
            select(Lead)
            .where(Lead.phone == phone)
            .where(Lead.deleted_at.is_(None))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_leads_by_assignee(self, user_id: int) -> list[Lead]:
        query = (
            select(Lead)
            .where(Lead.assigned_to == user_id)
            .where(Lead.deleted_at.is_(None))
            .order_by(Lead.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_by_status(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        user_id: int | None = None,
        team_id: int | None = None,
    ) -> dict[str, int]:
        """Count leads grouped by status."""
        query = (
            select(Lead.status, func.count(Lead.id))
            .where(Lead.deleted_at.is_(None))
            .group_by(Lead.status)
        )
        if start_date:
            query = query.where(cast(Lead.created_at, Date) >= start_date)
        if end_date:
            query = query.where(cast(Lead.created_at, Date) <= end_date)
        if user_id:
            query = query.where(Lead.assigned_to == user_id)
        if team_id:
            query = query.where(Lead.team_id == team_id)

        result = await self.session.execute(query)
        return {row[0]: row[1] for row in result.all()}

    async def get_by_id(self, id: int, options=None):
        opts = options or []
        opts.extend([selectinload(Lead.assignee), selectinload(Lead.team)])
        return await super().get_by_id(id, options=opts)

    async def get_all(self, **kwargs):
        opts = kwargs.get("options", [])
        opts.extend([selectinload(Lead.assignee), selectinload(Lead.team)])
        kwargs["options"] = opts
        return await super().get_all(**kwargs)


class CallRepository(BaseRepository[Call]):
    """Repository for Call operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Call, session)

    async def count_calls_by_sale(
        self,
        sale_id: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> int:
        query = select(func.count(Call.id)).where(Call.sale_id == sale_id)
        if start_date:
            query = query.where(cast(Call.call_time, Date) >= start_date)
        if end_date:
            query = query.where(cast(Call.call_time, Date) <= end_date)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_by_id(self, id: int, options=None):
        opts = options or []
        opts.extend([selectinload(Call.sale), selectinload(Call.lead)])
        return await super().get_by_id(id, options=opts)

    async def get_all(self, **kwargs):
        opts = kwargs.get("options", [])
        opts.extend([selectinload(Call.sale), selectinload(Call.lead)])
        kwargs["options"] = opts
        return await super().get_all(**kwargs)


class OpportunityRepository(BaseRepository[Opportunity]):
    """Repository for Opportunity operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Opportunity, session)

    async def get_by_id(self, id: int, options=None):
        opts = options or []
        opts.extend([selectinload(Opportunity.lead)])
        return await super().get_by_id(id, options=opts)

    async def get_all(self, **kwargs):
        opts = kwargs.get("options", [])
        opts.extend([selectinload(Opportunity.lead)])
        kwargs["options"] = opts
        return await super().get_all(**kwargs)


class DealRepository(BaseRepository[Deal]):
    """Repository for Deal operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Deal, session)

    async def get_revenue_by_period(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        user_id: int | None = None,
    ) -> float:
        """Sum actual revenue for won deals in a period."""
        query = (
            select(func.coalesce(func.sum(Deal.actual_revenue), 0))
            .where(Deal.status == "won")
            .where(Deal.deleted_at.is_(None))
        )
        if start_date:
            query = query.where(cast(Deal.closed_at, Date) >= start_date)
        if end_date:
            query = query.where(cast(Deal.closed_at, Date) <= end_date)
        if user_id:
            query = query.where(Deal.created_by == user_id)

        result = await self.session.execute(query)
        return float(result.scalar() or 0)
