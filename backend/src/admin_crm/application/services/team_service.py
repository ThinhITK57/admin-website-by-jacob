"""Team gRPC service implementation."""

import math

import grpc

try:
    import team_pb2
    import team_pb2_grpc
    import common_pb2
except ImportError:
    team_pb2 = None
    team_pb2_grpc = object
    common_pb2 = None

from sqlalchemy.orm import selectinload
from admin_crm.db.models.team import Team
from admin_crm.config.database import async_session_factory
from admin_crm.db.repositories import TeamRepository
from admin_crm.infrastructure.interceptors import get_current_user_id
from admin_crm.utils.logger import get_logger

logger = get_logger("team_service")


class TeamServiceImpl(team_pb2_grpc.TeamServiceServicer if team_pb2_grpc != object else object):
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
            
            # Eager load leader for the created team
            team = await repo.get_by_id(team.id)
            logger.info("team_created", team_id=team.id)
            return self._team_to_proto(team)

    async def GetTeam(self, request, context):
        async with async_session_factory() as session:
            repo = TeamRepository(session)
            # Need leader eager loaded? _team_to_proto needs it.
            # wait, BaseRepository.get_by_id doesn't take options either.
            # I can just refresh the entity inside _team_to_proto implicitly or modify get_by_id later.
            # Actually Team doesn't crash on GetTeam because the session is open when _team_to_proto is called!
            team = await repo.get_by_id(request.id, options=[selectinload(Team.leader)])

            if not team:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Team not found")
                return

            return self._team_to_proto(team)

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
                options=[selectinload(Team.leader)],
            )

            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return team_pb2.ListTeamsResponse(
                teams=[self._team_to_proto(t) for t in teams],
                pagination=common_pb2.PaginationResponse(
                    total=total, page=page,
                    page_size=page_size, total_pages=total_pages,
                ),
            )

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
            return self._team_to_proto(team)

    async def DeleteTeam(self, request, context):
        async with async_session_factory() as session:
            repo = TeamRepository(session)
            success = await repo.soft_delete(request.id)
            if not success:
                await context.abort(grpc.StatusCode.NOT_FOUND, "Team not found")
                return
            await session.commit()
            return common_pb2.StatusResponse(success=True, message="Team deleted")

    @staticmethod
    def _team_to_proto(team) -> "team_pb2.TeamResponse":
        return team_pb2.TeamResponse(
            id=team.id,
            name=team.name or "",
            leader_id=team.leader_id if team.leader_id else 0,
            leader_name=getattr(team, 'leader', None) and team.leader.name or "",
            description=team.description or "",
            member_count=getattr(team, 'member_count', 0) or 0,
            created_at=team.created_at.isoformat() if team.created_at else "",
            updated_at=team.updated_at.isoformat() if team.updated_at else "",
        )
