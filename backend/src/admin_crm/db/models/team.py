"""Team ORM model."""

from sqlalchemy import Integer, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from admin_crm.db.models.base import BaseModel


class Team(BaseModel):
    """Team model - groups users under a leader."""

    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    leader_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    leader = relationship("User", foreign_keys=[leader_id], lazy="selectin")
    members = relationship(
        "User",
        back_populates="team",
        foreign_keys="User.team_id",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Team(id={self.id}, name='{self.name}')>"

    @property
    def member_count(self) -> int:
        return len(self.members) if self.members else 0
