"""Marketing/Ads module ORM models - Campaign, AdGroup, Ad, CampaignMetrics."""

import enum

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from admin_crm.db.models.base import Base, BaseModel, TimestampMixin


# =============================================
# Enums
# =============================================

class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class AdChannel(str, enum.Enum):
    FACEBOOK = "facebook"
    GOOGLE = "google"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    OTHER = "other"


# =============================================
# Campaign
# =============================================

class Campaign(BaseModel):
    """Marketing campaign."""

    __tablename__ = "campaigns"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    budget: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    start_date: Mapped = mapped_column(Date, nullable=True)
    end_date: Mapped = mapped_column(Date, nullable=True)
    channel: Mapped[str | None] = mapped_column(
        Enum("facebook", "google", "tiktok", "youtube", "other",
             name="ad_channel", create_type=False),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        Enum("draft", "active", "paused", "completed", "archived",
             name="campaign_status", create_type=False),
        default="draft",
        server_default="draft",
    )
    owner_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], lazy="selectin")
    ad_groups = relationship("AdGroup", back_populates="campaign", lazy="selectin")
    metrics = relationship("CampaignMetric", back_populates="campaign", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Campaign(id={self.id}, name='{self.name}', status='{self.status}')>"


# =============================================
# Ad Group
# =============================================

class AdGroup(Base, TimestampMixin):
    """Ad group within a campaign."""

    __tablename__ = "ad_groups"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    budget: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    # Relationships
    campaign = relationship("Campaign", back_populates="ad_groups")
    ads = relationship("Ad", back_populates="ad_group", lazy="selectin")

    def __repr__(self) -> str:
        return f"<AdGroup(id={self.id}, name='{self.name}')>"

    @property
    def ad_count(self) -> int:
        return len(self.ads) if self.ads else 0


# =============================================
# Ad (Creative)
# =============================================

class Ad(Base, TimestampMixin):
    """Individual ad creative within an ad group."""

    __tablename__ = "ads"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ad_group_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ad_groups.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    creative_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    headline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    ad_group = relationship("AdGroup", back_populates="ads")

    def __repr__(self) -> str:
        return f"<Ad(id={self.id}, name='{self.name}')>"


# =============================================
# Campaign Metrics (daily aggregation)
# =============================================

class CampaignMetric(Base):
    """Daily metrics for a campaign - imported from ad platforms."""

    __tablename__ = "campaign_metrics"
    __table_args__ = (
        UniqueConstraint("campaign_id", "date", name="uq_campaign_metrics_campaign_date"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped = mapped_column(Date, nullable=False)
    impressions: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    clicks: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0, server_default="0")
    conversions: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    revenue: Mapped[float] = mapped_column(Numeric(15, 2), default=0, server_default="0")

    # Relationships
    campaign = relationship("Campaign", back_populates="metrics")

    def __repr__(self) -> str:
        return f"<CampaignMetric(campaign_id={self.campaign_id}, date={self.date})>"

    @property
    def cpc(self) -> float:
        """Cost per click."""
        return float(self.cost / self.clicks) if self.clicks else 0.0

    @property
    def ctr(self) -> float:
        """Click-through rate (%)."""
        return float(self.clicks / self.impressions * 100) if self.impressions else 0.0

    @property
    def roas(self) -> float:
        """Return on ad spend."""
        return float(self.revenue / self.cost) if self.cost else 0.0
