"""Campaign gRPC service implementation - Ads/Marketing module."""

import math
from datetime import date

import grpc

from admin_crm.config.database import async_session_factory
from admin_crm.db.repositories import (
    AdGroupRepository,
    AdRepository,
    CampaignMetricRepository,
    CampaignRepository,
)
from admin_crm.infrastructure.interceptors import get_current_user_id
from admin_crm.utils.logger import get_logger

logger = get_logger("campaign_service")


class CampaignServiceImpl:
    """gRPC CampaignService implementation for Ads/Marketing module."""

    async def CreateCampaign(self, request, context):
        async with async_session_factory() as session:
            repo = CampaignRepository(session)

            campaign = await repo.create(
                name=request.name,
                budget=request.budget if request.HasField("budget") else None,
                start_date=(
                    date.fromisoformat(request.start_date)
                    if request.HasField("start_date") else None
                ),
                end_date=(
                    date.fromisoformat(request.end_date)
                    if request.HasField("end_date") else None
                ),
                channel=request.channel,
                status=request.status if request.HasField("status") else "draft",
                owner_id=get_current_user_id(),
                created_by=get_current_user_id(),
            )

            await session.commit()
            campaign = await repo.get_with_relations(campaign.id)
            logger.info("campaign_created", campaign_id=campaign.id)
            return self._campaign_to_response(campaign)

    async def GetCampaign(self, request, context):
        async with async_session_factory() as session:
            repo = CampaignRepository(session)
            metric_repo = CampaignMetricRepository(session)

            campaign = await repo.get_with_relations(request.id)
            if not campaign:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Campaign not found")
                return

            summary = await metric_repo.get_summary(campaign.id)

            return {
                "campaign": self._campaign_to_response(campaign),
                "ad_groups": [
                    {
                        "id": ag.id,
                        "campaign_id": ag.campaign_id,
                        "name": ag.name or "",
                        "budget": float(ag.budget or 0),
                        "ad_count": ag.ad_count,
                        "created_at": ag.created_at.isoformat() if ag.created_at else "",
                    }
                    for ag in (campaign.ad_groups or [])
                ],
                "metrics_summary": summary,
            }

    async def ListCampaigns(self, request, context):
        async with async_session_factory() as session:
            repo = CampaignRepository(session)
            page = request.pagination.page or 1
            page_size = request.pagination.page_size or 20

            filters = {}
            for f in request.filters:
                if f.field in ("status", "channel", "owner_id"):
                    filters[f.field] = f.value

            campaigns, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=request.pagination.sort_by or "id",
                sort_order=request.pagination.sort_order or "desc",
                filters=filters,
                search=request.search or None,
                search_fields=["name"],
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return {
                "campaigns": [self._campaign_to_response(c) for c in campaigns],
                "pagination": {
                    "total": total, "page": page,
                    "page_size": page_size, "total_pages": total_pages,
                },
            }

    async def UpdateCampaign(self, request, context):
        async with async_session_factory() as session:
            repo = CampaignRepository(session)

            update_data = {}
            for field in ["name", "channel", "status"]:
                if request.HasField(field):
                    update_data[field] = getattr(request, field)
            if request.HasField("budget"):
                update_data["budget"] = request.budget
            if request.HasField("start_date"):
                update_data["start_date"] = date.fromisoformat(request.start_date)
            if request.HasField("end_date"):
                update_data["end_date"] = date.fromisoformat(request.end_date)

            update_data["updated_by"] = get_current_user_id()

            campaign = await repo.update(request.id, **update_data)
            if not campaign:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Campaign not found")
                return

            await session.commit()
            campaign = await repo.get_with_relations(request.id)
            return self._campaign_to_response(campaign)

    async def DeleteCampaign(self, request, context):
        async with async_session_factory() as session:
            repo = CampaignRepository(session)
            success = await repo.soft_delete(request.id)
            if not success:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Campaign not found")
                return
            await session.commit()
            return {"success": True, "message": "Campaign deleted"}

    # --- Ad Groups ---

    async def CreateAdGroup(self, request, context):
        async with async_session_factory() as session:
            repo = AdGroupRepository(session)

            ad_group = await repo.create(
                campaign_id=request.campaign_id,
                name=request.name,
                budget=request.budget if request.HasField("budget") else None,
            )

            await session.commit()
            return {
                "id": ad_group.id,
                "campaign_id": ad_group.campaign_id,
                "name": ad_group.name or "",
                "budget": float(ad_group.budget or 0),
                "ad_count": 0,
                "created_at": ad_group.created_at.isoformat() if ad_group.created_at else "",
            }

    async def ListAdGroups(self, request, context):
        async with async_session_factory() as session:
            repo = AdGroupRepository(session)
            ad_groups = await repo.get_by_campaign(request.id)

            return {
                "ad_groups": [
                    {
                        "id": ag.id,
                        "campaign_id": ag.campaign_id,
                        "name": ag.name or "",
                        "budget": float(ag.budget or 0),
                        "ad_count": ag.ad_count,
                        "created_at": ag.created_at.isoformat() if ag.created_at else "",
                    }
                    for ag in ad_groups
                ],
            }

    # --- Ads ---

    async def CreateAd(self, request, context):
        async with async_session_factory() as session:
            repo = AdRepository(session)

            ad = await repo.create(
                ad_group_id=request.ad_group_id,
                name=request.name,
                creative_url=request.creative_url if request.HasField("creative_url") else None,
                headline=request.headline if request.HasField("headline") else None,
                description=request.description if request.HasField("description") else None,
            )

            await session.commit()
            return {
                "id": ad.id,
                "ad_group_id": ad.ad_group_id,
                "name": ad.name or "",
                "creative_url": ad.creative_url or "",
                "headline": ad.headline or "",
                "description": ad.description or "",
                "created_at": ad.created_at.isoformat() if ad.created_at else "",
            }

    async def ListAds(self, request, context):
        async with async_session_factory() as session:
            repo = AdRepository(session)
            ads = await repo.get_by_ad_group(request.id)

            return {
                "ads": [
                    {
                        "id": a.id,
                        "ad_group_id": a.ad_group_id,
                        "name": a.name or "",
                        "creative_url": a.creative_url or "",
                        "headline": a.headline or "",
                        "description": a.description or "",
                        "created_at": a.created_at.isoformat() if a.created_at else "",
                    }
                    for a in ads
                ],
            }

    # --- Metrics ---

    async def UpsertCampaignMetrics(self, request, context):
        async with async_session_factory() as session:
            repo = CampaignMetricRepository(session)

            await repo.upsert(
                campaign_id=request.campaign_id,
                metric_date=date.fromisoformat(request.date),
                impressions=request.impressions,
                clicks=request.clicks,
                cost=request.cost,
                conversions=request.conversions,
                revenue=request.revenue,
            )

            await session.commit()
            return {"success": True, "message": "Metrics updated"}

    async def GetCampaignMetrics(self, request, context):
        async with async_session_factory() as session:
            repo = CampaignMetricRepository(session)

            start = date.fromisoformat(request.start_date)
            end = date.fromisoformat(request.end_date)

            metrics = await repo.get_metrics_by_period(
                campaign_id=request.campaign_id,
                start_date=start,
                end_date=end,
            )
            summary = await repo.get_summary(request.campaign_id)

            return {
                "metrics": [
                    {
                        "date": str(m.date),
                        "impressions": int(m.impressions or 0),
                        "clicks": int(m.clicks or 0),
                        "cost": float(m.cost or 0),
                        "conversions": int(m.conversions or 0),
                        "revenue": float(m.revenue or 0),
                        "cpc": m.cpc,
                        "ctr": m.ctr,
                        "roas": m.roas,
                    }
                    for m in metrics
                ],
                "summary": summary,
            }

    @staticmethod
    def _campaign_to_response(campaign) -> dict:
        return {
            "id": campaign.id,
            "name": campaign.name or "",
            "budget": float(campaign.budget or 0),
            "start_date": str(campaign.start_date) if campaign.start_date else "",
            "end_date": str(campaign.end_date) if campaign.end_date else "",
            "channel": campaign.channel or "",
            "status": campaign.status or "draft",
            "owner_id": campaign.owner_id or 0,
            "owner_name": campaign.owner.name if campaign.owner else "",
            "created_at": campaign.created_at.isoformat() if campaign.created_at else "",
            "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else "",
        }
