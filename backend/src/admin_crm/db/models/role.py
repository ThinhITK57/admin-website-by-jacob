"""Role and Permission ORM models with pivot tables."""

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from admin_crm.db.models.base import Base

# =============================================
# Pivot Tables (Many-to-Many)
# =============================================

role_has_permissions = Table(
    "role_has_permissions",
    Base.metadata,
    Column(
        "permission_id",
        BigInteger,
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "role_id",
        BigInteger,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

model_has_roles = Table(
    "model_has_roles",
    Base.metadata,
    Column(
        "role_id",
        BigInteger,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("model_type", String(50), default="User", primary_key=True),
    Column("model_id", BigInteger, nullable=False, primary_key=True),
)


# =============================================
# Role Model
# =============================================


class Role(Base):
    """Role model for RBAC."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    guard_name: Mapped[str] = mapped_column(String(100), default="web", server_default="web")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    permissions = relationship(
        "Permission",
        secondary=role_has_permissions,
        back_populates="roles",
        lazy="selectin",
    )
    users = relationship(
        "User",
        secondary=model_has_roles,
        back_populates="roles",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"

    @property
    def permission_names(self) -> list[str]:
        return [p.name for p in self.permissions] if self.permissions else []


# =============================================
# Permission Model
# =============================================


class Permission(Base):
    """Permission model - granular access control."""

    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    guard_name: Mapped[str] = mapped_column(String(100), default="web", server_default="web")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    roles = relationship(
        "Role",
        secondary=role_has_permissions,
        back_populates="permissions",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, name='{self.name}')>"
