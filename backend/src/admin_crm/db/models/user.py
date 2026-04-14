"""User ORM model."""

from sqlalchemy import Integer, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from admin_crm.db.models.base import BaseModel

# Python enum for user status
import enum


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class User(BaseModel):
    """User table - core entity for authentication and RBAC."""

    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(512), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", "suspended", name="user_status", create_type=False),
        default="active",
        server_default="active",
    )
    team_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
    roles = relationship(
        "Role",
        secondary="model_has_roles",
        primaryjoin="User.id == model_has_roles.c.model_id",
        secondaryjoin="Role.id == model_has_roles.c.role_id",
        back_populates="users",
        lazy="selectin",
    )
    sale_staff = relationship("SaleStaff", back_populates="user", uselist=False)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', status='{self.status}')>"

    @property
    def role_names(self) -> list[str]:
        """Get list of role names for this user."""
        return [role.name for role in self.roles] if self.roles else []

    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role."""
        return role_name in self.role_names

    def has_permission(self, permission_name: str) -> bool:
        """Check if user has a specific permission via any of their roles."""
        if not self.roles:
            return False
        for role in self.roles:
            if role.permissions:
                for perm in role.permissions:
                    if perm.name == permission_name:
                        return True
        return False
