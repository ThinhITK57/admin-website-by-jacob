"""Team repository."""

from sqlalchemy.ext.asyncio import AsyncSession

from admin_crm.db.models.team import Team
from admin_crm.db.repositories.base import BaseRepository


class TeamRepository(BaseRepository[Team]):
    """Repository for Team CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Team, session)
