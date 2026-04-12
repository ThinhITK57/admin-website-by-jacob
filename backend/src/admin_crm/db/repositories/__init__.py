"""Repositories package."""

from admin_crm.db.repositories.activity_log_repository import ActivityLogRepository
from admin_crm.db.repositories.base import BaseRepository
from admin_crm.db.repositories.campaign_repository import (
    AdGroupRepository,
    AdRepository,
    CampaignMetricRepository,
    CampaignRepository,
)
from admin_crm.db.repositories.role_repository import PermissionRepository, RoleRepository
from admin_crm.db.repositories.sale_repository import (
    CallRepository,
    DealRepository,
    LeadRepository,
    OpportunityRepository,
    SaleStaffRepository,
)
from admin_crm.db.repositories.team_repository import TeamRepository
from admin_crm.db.repositories.user_repository import UserRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "RoleRepository",
    "PermissionRepository",
    "TeamRepository",
    "SaleStaffRepository",
    "LeadRepository",
    "CallRepository",
    "OpportunityRepository",
    "DealRepository",
    "CampaignRepository",
    "AdGroupRepository",
    "AdRepository",
    "CampaignMetricRepository",
    "ActivityLogRepository",
]
