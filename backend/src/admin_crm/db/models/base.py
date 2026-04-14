"""SQLAlchemy Base model with common columns and soft delete support."""

from datetime import datetime

from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Use Integer for SQLite compatibility (autoincrement requires INTEGER PK)
# In production with PostgreSQL, switch back to BigInteger
PK_TYPE = Integer


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    __allow_unmapped__ = True


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Mixin that adds soft delete support via deleted_at column."""

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class AuditMixin:
    """Mixin that tracks who created/updated a record."""

    created_by: Mapped[int | None] = mapped_column(
        PK_TYPE,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_by: Mapped[int | None] = mapped_column(
        PK_TYPE,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class BaseModel(Base, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Abstract base model with id, timestamps, soft delete, and audit fields.

    All domain models should inherit from this.
    """

    __abstract__ = True

    id: Mapped[int] = mapped_column(PK_TYPE, primary_key=True, autoincrement=True)

