"""Database models package - import all models here for Alembic discovery."""

from admin_crm.db.models.activity_log import ActivityLog
from admin_crm.db.models.base import Base, BaseModel
from admin_crm.db.models.campaign import Ad, AdGroup, Campaign, CampaignMetric
from admin_crm.db.models.role import Permission, Role, model_has_roles, role_has_permissions
from admin_crm.db.models.sale import Call, Deal, Lead, Opportunity, SaleStaff
from admin_crm.db.models.team import Team
from admin_crm.db.models.user import User

__all__ = [
    # Base
    "Base",
    "BaseModel",
    # Core
    "User",
    "Role",
    "Permission",
    "Team",
    "ActivityLog",
    # Pivot tables
    "role_has_permissions",
    "model_has_roles",
    # Telesale
    "SaleStaff",
    "Call",
    "Lead",
    "Opportunity",
    "Deal",
    # Marketing
    "Campaign",
    "AdGroup",
    "Ad",
    "CampaignMetric",
]
