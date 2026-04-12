"""Campaign repository - data access for Marketing module."""

from datetime import date

from sqlalchemy import Date, and_, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from admin_crm.db.models.campaign import Ad, AdGroup, Campaign, CampaignMetric
from admin_crm.db.repositories.base import BaseRepository


class CampaignRepository(BaseRepository[Campaign]):
    """Repository for Campaign CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Campaign, session)

    async def get_with_relations(self, id: int) -> Campaign | None:
        """Get campaign with ad groups, ads, and owner loaded."""
        query = (
            select(Campaign)
            .where(Campaign.id == id)
            .where(Campaign.deleted_at.is_(None))
            .options(
                selectinload(Campaign.owner),
                selectinload(Campaign.ad_groups).selectinload(AdGroup.ads),
                selectinload(Campaign.metrics),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()


class AdGroupRepository(BaseRepository[AdGroup]):
    """Repository for AdGroup operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AdGroup, session)

    async def get_by_campaign(self, campaign_id: int) -> list[AdGroup]:
        query = (
            select(AdGroup)
            .where(AdGroup.campaign_id == campaign_id)
            .options(selectinload(AdGroup.ads))
            .order_by(AdGroup.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class AdRepository(BaseRepository[Ad]):
    """Repository for Ad operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Ad, session)

    async def get_by_ad_group(self, ad_group_id: int) -> list[Ad]:
        query = (
            select(Ad)
            .where(Ad.ad_group_id == ad_group_id)
            .order_by(Ad.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class CampaignMetricRepository(BaseRepository[CampaignMetric]):
    """Repository for CampaignMetric operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(CampaignMetric, session)

    async def upsert(
        self, campaign_id: int, metric_date: date, **kwargs
    ) -> CampaignMetric:
        """Insert or update daily metrics for a campaign."""
        query = select(CampaignMetric).where(
            and_(
                CampaignMetric.campaign_id == campaign_id,
                CampaignMetric.date == metric_date,
            )
        )
        result = await self.session.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            for key, value in kwargs.items():
                if hasattr(existing, key) and value is not None:
                    setattr(existing, key, value)
            await self.session.flush()
            return existing
        else:
            return await self.create(
                campaign_id=campaign_id,
                date=metric_date,
                **kwargs,
            )

    async def get_metrics_by_period(
        self, campaign_id: int, start_date: date, end_date: date
    ) -> list[CampaignMetric]:
        """Get daily metrics for a campaign within a date range."""
        query = (
            select(CampaignMetric)
            .where(
                and_(
                    CampaignMetric.campaign_id == campaign_id,
                    CampaignMetric.date >= start_date,
                    CampaignMetric.date <= end_date,
                )
            )
            .order_by(CampaignMetric.date.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_summary(self, campaign_id: int) -> dict:
        """Get aggregated metrics summary for a campaign."""
        query = (
            select(
                func.sum(CampaignMetric.impressions).label("total_impressions"),
                func.sum(CampaignMetric.clicks).label("total_clicks"),
                func.sum(CampaignMetric.cost).label("total_cost"),
                func.sum(CampaignMetric.conversions).label("total_conversions"),
                func.sum(CampaignMetric.revenue).label("total_revenue"),
            )
            .where(CampaignMetric.campaign_id == campaign_id)
        )
        result = await self.session.execute(query)
        row = result.one()

        total_clicks = float(row.total_clicks or 0)
        total_impressions = float(row.total_impressions or 0)
        total_cost = float(row.total_cost or 0)
        total_revenue = float(row.total_revenue or 0)

        return {
            "total_impressions": int(total_impressions),
            "total_clicks": int(total_clicks),
            "total_cost": total_cost,
            "total_conversions": int(row.total_conversions or 0),
            "total_revenue": total_revenue,
            "avg_cpc": total_cost / total_clicks if total_clicks else 0,
            "avg_ctr": total_clicks / total_impressions * 100 if total_impressions else 0,
            "roas": total_revenue / total_cost if total_cost else 0,
        }
