"""Team gRPC service implementation."""

import math

import grpc

from admin_crm.config.database import async_session_factory
from admin_crm.db.repositories import TeamRepository
from admin_crm.infrastructure.interceptors import get_current_user_id
from admin_crm.utils.logger import get_logger

logger = get_logger("team_service")


class TeamServiceImpl:
    """gRPC TeamService implementation."""

    async def CreateTeam(self, request, context):
        async with async_session_factory() as session:
            repo = TeamRepository(session)

            team = await repo.create(
                name=request.name,
                leader_id=request.leader_id if request.HasField("leader_id") else None,
                description=request.description if request.HasField("description") else None,
                created_by=get_current_user_id(),
            )

            await session.commit()
            logger.info("team_created", team_id=team.id)
            return self._team_to_response(team)

    async def GetTeam(self, request, context):
        async with async_session_factory() as session:
            repo = TeamRepository(session)
            team = await repo.get_by_id(request.id)

            if not team:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Team not found")
                return

            return self._team_to_response(team)

    async def ListTeams(self, request, context):
        async with async_session_factory() as session:
            repo = TeamRepository(session)
            page = request.pagination.page or 1
            page_size = request.pagination.page_size or 20

            teams, total = await repo.get_all(
                page=page,
                page_size=page_size,
                sort_by=request.pagination.sort_by or "id",
                sort_order=request.pagination.sort_order or "asc",
                search=request.search or None,
                search_fields=["name", "description"],
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return {
                "teams": [self._team_to_response(t) for t in teams],
                "pagination": {
                    "total": total, "page": page,
                    "page_size": page_size, "total_pages": total_pages,
                },
            }

    async def UpdateTeam(self, request, context):
        async with async_session_factory() as session:
            repo = TeamRepository(session)

            update_data = {}
            if request.HasField("name"):
                update_data["name"] = request.name
            if request.HasField("leader_id"):
                update_data["leader_id"] = request.leader_id
            if request.HasField("description"):
                update_data["description"] = request.description

            update_data["updated_by"] = get_current_user_id()

            team = await repo.update(request.id, **update_data)
            if not team:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Team not found")
                return

            await session.commit()
            return self._team_to_response(team)

    async def DeleteTeam(self, request, context):
        async with async_session_factory() as session:
            repo = TeamRepository(session)
            success = await repo.soft_delete(request.id)
            if not success:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Team not found")
                return
            await session.commit()
            return {"success": True, "message": "Team deleted"}

    @staticmethod
    def _team_to_response(team) -> dict:
        return {
            "id": team.id,
            "name": team.name or "",
            "leader_id": team.leader_id,
            "leader_name": team.leader.name if team.leader else "",
            "description": team.description or "",
            "member_count": team.member_count,
            "created_at": team.created_at.isoformat() if team.created_at else "",
            "updated_at": team.updated_at.isoformat() if team.updated_at else "",
        }
