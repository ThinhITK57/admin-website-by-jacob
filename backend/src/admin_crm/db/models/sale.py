"""Telesale module ORM models - SaleStaff, Call, Lead, Opportunity, Deal."""

import enum

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from admin_crm.db.models.base import Base, BaseModel, TimestampMixin


# =============================================
# Enums
# =============================================

class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONVERTED = "converted"


class DealStatus(str, enum.Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"


# =============================================
# Sale Staff (extension of User)
# =============================================

class SaleStaff(Base, TimestampMixin):
    """Additional sale-specific info linked to a User."""

    __tablename__ = "sale_staff"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    target_revenue_monthly: Mapped[float] = mapped_column(
        Numeric(15, 2), default=0, server_default="0"
    )
    commission_rate: Mapped[float] = mapped_column(
        Numeric(5, 2), default=0, server_default="0"
    )
    deleted_at: Mapped = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sale_staff", lazy="selectin")

    def __repr__(self) -> str:
        return f"<SaleStaff(id={self.id}, user_id={self.user_id})>"


# =============================================
# Call
# =============================================

class Call(Base):
    """Phone call log for telesale tracking."""

    __tablename__ = "calls"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    sale_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    lead_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    call_time: Mapped = mapped_column(DateTime(timezone=True), nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    result: Mapped[str | None] = mapped_column(String(50), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped = mapped_column(
        DateTime(timezone=True),
        server_default="now()",
    )
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    sale = relationship("User", foreign_keys=[sale_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<Call(id={self.id}, sale_id={self.sale_id}, result='{self.result}')>"


# =============================================
# Lead
# =============================================

class Lead(BaseModel):
    """Sales lead - potential customer."""

    __tablename__ = "leads"

    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("new", "contacted", "qualified", "unqualified", "converted",
             name="lead_status", create_type=False),
        default="new",
        server_default="new",
    )
    assigned_to: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    team_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    assignee = relationship("User", foreign_keys=[assigned_to], lazy="selectin")
    team = relationship("Team", lazy="selectin")
    opportunities = relationship("Opportunity", back_populates="lead", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, name='{self.name}', status='{self.status}')>"


# =============================================
# Opportunity
# =============================================

class Opportunity(BaseModel):
    """Sales opportunity - qualified lead with potential value."""

    __tablename__ = "opportunities"

    lead_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False
    )
    value: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    stage: Mapped[str | None] = mapped_column(String(50), nullable=True)
    probability: Mapped[int | None] = mapped_column(
        Integer,
        CheckConstraint("probability BETWEEN 0 AND 100"),
        nullable=True,
    )
    expected_close_date: Mapped = mapped_column(Date, nullable=True)

    # Relationships
    lead = relationship("Lead", back_populates="opportunities", lazy="selectin")
    deal = relationship("Deal", back_populates="opportunity", uselist=False, lazy="selectin")

    def __repr__(self) -> str:
        return f"<Opportunity(id={self.id}, stage='{self.stage}', value={self.value})>"


# =============================================
# Deal (closed opportunity)
# =============================================

class Deal(BaseModel):
    """Closed deal - won or lost opportunity."""

    __tablename__ = "deals"

    opportunity_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("pending", "won", "lost", name="deal_status", create_type=False),
        default="pending",
        server_default="pending",
    )
    actual_revenue: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    closed_at: Mapped = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="deal", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Deal(id={self.id}, status='{self.status}', revenue={self.actual_revenue})>"
