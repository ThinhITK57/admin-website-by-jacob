"""Activity Log repository for audit trail."""

from sqlalchemy.ext.asyncio import AsyncSession

from admin_crm.db.models.activity_log import ActivityLog
from admin_crm.db.repositories.base import BaseRepository


class ActivityLogRepository(BaseRepository[ActivityLog]):
    """Repository for ActivityLog operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ActivityLog, session)

    async def log_activity(
        self,
        event: str,
        subject_type: str | None = None,
        subject_id: int | None = None,
        causer_id: int | None = None,
        description: str | None = None,
        properties: dict | None = None,
    ) -> ActivityLog:
        """Create an audit log entry."""
        return await self.create(
            log_name="default",
            event=event,
            subject_type=subject_type,
            subject_id=subject_id,
            causer_type="User" if causer_id else None,
            causer_id=causer_id,
            description=description,
            properties=properties or {},
        )
