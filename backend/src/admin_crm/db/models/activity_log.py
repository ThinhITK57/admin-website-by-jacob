"""Activity Log ORM model for audit trail."""

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from admin_crm.db.models.base import Base


class ActivityLog(Base):
    """System-wide audit log - tracks all user actions."""

    __tablename__ = "activity_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    log_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subject_type: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    subject_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    causer_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    causer_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    event: Mapped[str | None] = mapped_column(String(100), nullable=True)
    properties: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    causer = relationship("User", foreign_keys=[causer_id], lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<ActivityLog(id={self.id}, event='{self.event}', "
            f"subject={self.subject_type}#{self.subject_id})>"
        )
