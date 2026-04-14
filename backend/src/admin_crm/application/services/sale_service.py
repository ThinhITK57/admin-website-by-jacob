"""Telesale gRPC service implementation."""

import math
from datetime import date, datetime, timezone

import grpc

try:
    import sale_pb2
    import sale_pb2_grpc
    import common_pb2
except ImportError:
    sale_pb2 = None
    sale_pb2_grpc = object
    common_pb2 = None

from admin_crm.config.database import async_session_factory
from admin_crm.db.repositories import (
    CallRepository,
    DealRepository,
    LeadRepository,
    OpportunityRepository,
    SaleStaffRepository,
)
from admin_crm.infrastructure.interceptors import get_current_user_id
from admin_crm.utils.logger import get_logger

logger = get_logger("telesale_service")


class TelesaleServiceImpl(sale_pb2_grpc.TelesaleServiceServicer if sale_pb2_grpc != object else object):
    """gRPC TelesaleService implementation."""

    # --- Sale Staff ---

    async def GetSaleStaff(self, request, context):
        async with async_session_factory() as session:
            repo = SaleStaffRepository(session)
            staff = await repo.get_by_id(request.id)
            if not staff:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Sale staff not found")
                return
            return self._staff_to_proto(staff)

    async def ListSaleStaff(self, request, context):
        async with async_session_factory() as session:
            repo = SaleStaffRepository(session)
            page = request.pagination.page or 1
            page_size = request.pagination.page_size or 20

            staff_list, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=request.pagination.sort_by or "id",
                sort_order=request.pagination.sort_order or "desc",
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return sale_pb2.ListSaleStaffResponse(
                staff=[self._staff_to_proto(s) for s in staff_list],
                pagination=common_pb2.PaginationResponse(
                    total=total, page=page,
                    page_size=page_size, total_pages=total_pages,
                ),
            )

    async def UpdateSaleStaff(self, request, context):
        async with async_session_factory() as session:
            repo = SaleStaffRepository(session)

            update_data = {}
            if request.HasField("target_revenue_monthly"):
                update_data["target_revenue_monthly"] = request.target_revenue_monthly
            if request.HasField("commission_rate"):
                update_data["commission_rate"] = request.commission_rate

            staff = await repo.update(request.id, **update_data)
            if not staff:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Sale staff not found")
                return

            await session.commit()
            return self._staff_to_proto(staff)

    # --- Leads ---

    async def CreateLead(self, request, context):
        async with async_session_factory() as session:
            repo = LeadRepository(session)

            if request.phone:
                existing = await repo.get_by_phone(request.phone)
                if existing:
                    await context.abort(
                        grpc.StatusCode.ALREADY_EXISTS, "Phone number already exists"
                    )
                    return

            lead = await repo.create(
                name=request.name,
                phone=request.phone,
                email=request.email if request.HasField("email") else None,
                source=request.source if request.HasField("source") else None,
                assigned_to=request.assigned_to if request.HasField("assigned_to") else None,
                team_id=request.team_id if request.HasField("team_id") else None,
                created_by=get_current_user_id(),
            )

            await session.commit()
            logger.info("lead_created", lead_id=lead.id)
            return self._lead_to_proto(lead)

    async def GetLead(self, request, context):
        async with async_session_factory() as session:
            repo = LeadRepository(session)
            lead = await repo.get_by_id(request.id)
            if not lead:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Lead not found")
                return
            return self._lead_to_proto(lead)

    async def ListLeads(self, request, context):
        async with async_session_factory() as session:
            repo = LeadRepository(session)
            page = request.pagination.page or 1
            page_size = request.pagination.page_size or 20

            filters = {}
            for f in request.filters:
                if f.field in ("status", "source", "assigned_to", "team_id"):
                    filters[f.field] = f.value

            leads, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=request.pagination.sort_by or "id",
                sort_order=request.pagination.sort_order or "desc",
                filters=filters,
                search=request.search or None,
                search_fields=["name", "phone", "email"],
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return sale_pb2.ListLeadsResponse(
                leads=[self._lead_to_proto(l) for l in leads],
                pagination=common_pb2.PaginationResponse(
                    total=total, page=page,
                    page_size=page_size, total_pages=total_pages,
                ),
            )

    async def UpdateLead(self, request, context):
        async with async_session_factory() as session:
            repo = LeadRepository(session)

            update_data = {}
            for field in ["name", "phone", "email", "source", "status"]:
                if request.HasField(field):
                    update_data[field] = getattr(request, field)
            if request.HasField("assigned_to"):
                update_data["assigned_to"] = request.assigned_to
            if request.HasField("team_id"):
                update_data["team_id"] = request.team_id

            update_data["updated_by"] = get_current_user_id()

            lead = await repo.update(request.id, **update_data)
            if not lead:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Lead not found")
                return

            await session.commit()
            return self._lead_to_proto(lead)

    async def DeleteLead(self, request, context):
        async with async_session_factory() as session:
            repo = LeadRepository(session)
            success = await repo.soft_delete(request.id)
            if not success:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Lead not found")
                return
            await session.commit()
            return common_pb2.StatusResponse(success=True, message="Lead deleted")

    async def ConvertLeadToOpportunity(self, request, context):
        async with async_session_factory() as session:
            lead_repo = LeadRepository(session)
            opp_repo = OpportunityRepository(session)

            lead = await lead_repo.get_by_id(request.lead_id)
            if not lead:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Lead not found")
                return

            lead.status = "converted"

            opp = await opp_repo.create(
                lead_id=lead.id,
                value=request.value,
                stage=request.stage if request.HasField("stage") else "discovery",
                probability=request.probability if request.HasField("probability") else 20,
                expected_close_date=(
                    date.fromisoformat(request.expected_close_date)
                    if request.HasField("expected_close_date") else None
                ),
                created_by=get_current_user_id(),
            )

            await session.commit()
            logger.info("lead_converted", lead_id=lead.id, opportunity_id=opp.id)
            return self._opportunity_to_proto(opp)

    # --- Calls ---

    async def CreateCall(self, request, context):
        async with async_session_factory() as session:
            repo = CallRepository(session)

            call = await repo.create(
                sale_id=get_current_user_id(),
                lead_id=request.lead_id,
                call_time=datetime.fromisoformat(request.call_time),
                duration_seconds=request.duration_seconds,
                result=request.result,
                note=request.note if request.HasField("note") else None,
                created_by=get_current_user_id(),
            )

            await session.commit()
            return self._call_to_proto(call)

    async def ListCalls(self, request, context):
        async with async_session_factory() as session:
            repo = CallRepository(session)
            page = request.pagination.page or 1
            page_size = request.pagination.page_size or 20

            filters = {}
            for f in request.filters:
                if f.field in ("sale_id", "result"):
                    filters[f.field] = f.value

            calls, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=request.pagination.sort_by or "id",
                sort_order=request.pagination.sort_order or "desc",
                filters=filters,
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return sale_pb2.ListCallsResponse(
                calls=[self._call_to_proto(c) for c in calls],
                pagination=common_pb2.PaginationResponse(
                    total=total, page=page,
                    page_size=page_size, total_pages=total_pages,
                ),
            )

    # --- Opportunities & Deals ---

    async def ListOpportunities(self, request, context):
        async with async_session_factory() as session:
            repo = OpportunityRepository(session)
            page = request.pagination.page or 1
            page_size = request.pagination.page_size or 20

            opps, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=request.pagination.sort_by or "id",
                sort_order=request.pagination.sort_order or "desc",
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return sale_pb2.ListOpportunitiesResponse(
                opportunities=[self._opportunity_to_proto(o) for o in opps],
                pagination=common_pb2.PaginationResponse(
                    total=total, page=page,
                    page_size=page_size, total_pages=total_pages,
                ),
            )

    async def UpdateOpportunity(self, request, context):
        async with async_session_factory() as session:
            repo = OpportunityRepository(session)

            update_data = {}
            if request.HasField("value"):
                update_data["value"] = request.value
            if request.HasField("stage"):
                update_data["stage"] = request.stage
            if request.HasField("probability"):
                update_data["probability"] = request.probability
            if request.HasField("expected_close_date"):
                update_data["expected_close_date"] = date.fromisoformat(
                    request.expected_close_date
                )

            opp = await repo.update(request.id, **update_data)
            if not opp:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Opportunity not found")
                return

            await session.commit()
            return self._opportunity_to_proto(opp)

    async def CloseDeal(self, request, context):
        async with async_session_factory() as session:
            deal_repo = DealRepository(session)

            deal = await deal_repo.create(
                opportunity_id=request.opportunity_id,
                status=request.status,
                actual_revenue=(
                    request.actual_revenue if request.HasField("actual_revenue") else None
                ),
                closed_at=datetime.now(timezone.utc),
                created_by=get_current_user_id(),
            )

            await session.commit()
            logger.info("deal_closed", deal_id=deal.id, status=deal.status)

            return sale_pb2.DealResponse(
                id=deal.id,
                opportunity_id=deal.opportunity_id,
                status=deal.status,
                actual_revenue=float(deal.actual_revenue or 0),
                closed_at=deal.closed_at.isoformat() if deal.closed_at else "",
                created_at=deal.created_at.isoformat() if deal.created_at else "",
            )

    # --- Performance ---

    async def GetSalePerformance(self, request, context):
        async with async_session_factory() as session:
            call_repo = CallRepository(session)
            lead_repo = LeadRepository(session)
            deal_repo = DealRepository(session)

            start = date.fromisoformat(request.start_date)
            end = date.fromisoformat(request.end_date)
            user_id = request.user_id if request.HasField("user_id") else None

            lead_counts = await lead_repo.count_by_status(
                start_date=start, end_date=end, user_id=user_id
            )

            total_leads = sum(lead_counts.values())
            qualified = lead_counts.get("qualified", 0) + lead_counts.get("converted", 0)
            revenue = await deal_repo.get_revenue_by_period(
                start_date=start, end_date=end, user_id=user_id
            )

            total_calls = 0
            if user_id:
                total_calls = await call_repo.count_calls_by_sale(
                    sale_id=user_id, start_date=start, end_date=end
                )

            conversion_rate = (qualified / total_leads * 100) if total_leads > 0 else 0

            return sale_pb2.SalePerformanceResponse(
                total_calls=total_calls,
                total_leads=total_leads,
                qualified_leads=qualified,
                total_opportunities=lead_counts.get("converted", 0),
                total_deals_won=0,
                total_revenue=revenue,
                conversion_rate=round(conversion_rate, 2),
                daily_metrics=[],
            )

    # --- Helpers ---

    @staticmethod
    def _staff_to_proto(staff):
        return sale_pb2.SaleStaffResponse(
            id=staff.id,
            user_id=staff.user_id,
            user_name=staff.user.name if getattr(staff, 'user', None) else "",
            user_email=staff.user.email if getattr(staff, 'user', None) else "",
            team_name=staff.user.team.name if getattr(staff, 'user', None) and getattr(staff.user, 'team', None) else "",
            target_revenue_monthly=float(staff.target_revenue_monthly or 0),
            commission_rate=float(staff.commission_rate or 0),
            created_at=staff.created_at.isoformat() if staff.created_at else "",
        )

    @staticmethod
    def _lead_to_proto(lead):
        return sale_pb2.LeadResponse(
            id=lead.id,
            name=lead.name or "",
            phone=lead.phone or "",
            email=lead.email or "",
            source=lead.source or "",
            status=lead.status or "new",
            assigned_to=lead.assigned_to if lead.assigned_to else 0,
            assigned_to_name=getattr(lead, 'assignee', None) and lead.assignee.name or "",
            team_id=lead.team_id if lead.team_id else 0,
            team_name=getattr(lead, 'team', None) and lead.team.name or "",
            created_at=lead.created_at.isoformat() if lead.created_at else "",
            updated_at=lead.updated_at.isoformat() if lead.updated_at else "",
        )

    @staticmethod
    def _call_to_proto(call):
        return sale_pb2.CallResponse(
            id=call.id,
            sale_id=call.sale_id or 0,
            sale_name=getattr(call, 'sale', None) and call.sale.name or "",
            lead_id=call.lead_id or 0,
            lead_name="",
            call_time=call.call_time.isoformat() if call.call_time else "",
            duration_seconds=call.duration_seconds or 0,
            result=call.result or "",
            note=call.note or "",
            created_at=call.created_at.isoformat() if call.created_at else "",
        )

    @staticmethod
    def _opportunity_to_proto(opp):
        return sale_pb2.OpportunityResponse(
            id=opp.id,
            lead_id=opp.lead_id,
            lead_name=getattr(opp, 'lead', None) and opp.lead.name or "",
            value=float(opp.value or 0),
            stage=opp.stage or "",
            probability=opp.probability or 0,
            expected_close_date=str(opp.expected_close_date) if opp.expected_close_date else "",
            created_at=opp.created_at.isoformat() if opp.created_at else "",
            updated_at=opp.updated_at.isoformat() if opp.updated_at else "",
        )
