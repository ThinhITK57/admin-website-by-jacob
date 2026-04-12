"""gRPC RBAC Interceptor - checks permissions based on user roles."""

from typing import Any, Callable

import grpc
import grpc.aio

from admin_crm.infrastructure.interceptors.auth_interceptor import get_current_user
from admin_crm.utils.logger import get_logger

logger = get_logger("rbac_interceptor")

# Method → required permission mapping
# Methods not in this map are allowed for any authenticated user
METHOD_PERMISSIONS: dict[str, str] = {
    # User management (admin only)
    "/admin_crm.UserService/CreateUser": "user.create",
    "/admin_crm.UserService/UpdateUser": "user.edit",
    "/admin_crm.UserService/DeleteUser": "user.delete",
    "/admin_crm.UserService/ListUsers": "user.view",

    # Role management
    "/admin_crm.RoleService/CreateRole": "role.create",
    "/admin_crm.RoleService/UpdateRole": "role.edit",
    "/admin_crm.RoleService/DeleteRole": "role.delete",
    "/admin_crm.RoleService/AssignPermissionsToRole": "permission.assign",
    "/admin_crm.RoleService/AssignRolesToUser": "permission.assign",

    # Telesale
    "/admin_crm.TelesaleService/CreateLead": "sale.create",
    "/admin_crm.TelesaleService/UpdateLead": "sale.edit",
    "/admin_crm.TelesaleService/DeleteLead": "sale.delete",
    "/admin_crm.TelesaleService/ListLeads": "sale.view",
    "/admin_crm.TelesaleService/CreateCall": "sale.create",
    "/admin_crm.TelesaleService/ListCalls": "sale.view",
    "/admin_crm.TelesaleService/GetSalePerformance": "sale.report",

    # Campaign
    "/admin_crm.CampaignService/CreateCampaign": "campaign.create",
    "/admin_crm.CampaignService/UpdateCampaign": "campaign.edit",
    "/admin_crm.CampaignService/DeleteCampaign": "campaign.delete",
    "/admin_crm.CampaignService/ListCampaigns": "campaign.view",
}

# Role hierarchy: higher roles inherit all permissions of lower roles
ROLE_HIERARCHY: dict[str, int] = {
    "super_admin": 100,
    "truong_phong": 80,
    "leader": 60,
    "nhan_vien": 40,
}


class RBACInterceptor(grpc.aio.ServerInterceptor):
    """Checks if the authenticated user has permission to access the requested method.

    Uses a method → permission mapping and checks against the user's roles.
    Super admins bypass all permission checks.
    """

    def __init__(self, permission_checker=None):
        """Initialize with optional custom permission checker.

        Args:
            permission_checker: Async callable(user_id, permission_name) -> bool
                If None, falls back to role-based checking from JWT claims.
        """
        self._permission_checker = permission_checker

    async def intercept_service(
        self,
        continuation: Callable,
        handler_call_details: grpc.HandlerCallDetails,
    ) -> Any:
        method = handler_call_details.method
        required_permission = METHOD_PERMISSIONS.get(method)

        # If no permission mapping, allow any authenticated user
        if not required_permission:
            return await continuation(handler_call_details)

        user_ctx = get_current_user()
        if not user_ctx:
            # This shouldn't happen if AuthInterceptor runs first
            return self._abort_forbidden("No user context found")

        user_roles = user_ctx.get("roles", [])

        # Super admin bypasses all checks
        if "super_admin" in user_roles:
            return await continuation(handler_call_details)

        # Check permission via custom checker or role-based fallback
        has_permission = False
        if self._permission_checker:
            has_permission = await self._permission_checker(
                user_ctx["user_id"], required_permission
            )
        else:
            # For now, we use the JWT roles. In production, query DB for exact permissions.
            # This is a simplified check - real implementation queries the DB.
            has_permission = self._check_role_permission(user_roles, required_permission)

        if not has_permission:
            logger.warning(
                "permission_denied",
                user_id=user_ctx["user_id"],
                method=method,
                required=required_permission,
                roles=user_roles,
            )
            return self._abort_forbidden(
                f"Permission denied: requires '{required_permission}'"
            )

        return await continuation(handler_call_details)

    @staticmethod
    def _check_role_permission(roles: list[str], permission: str) -> bool:
        """Simple role-based permission check.

        In production, this should query the database for the exact
        role → permission mapping. For MVP, we use a simplified check.
        """
        # Map permission prefixes to minimum role level needed
        permission_prefix = permission.split(".")[0] if "." in permission else permission
        action = permission.split(".")[1] if "." in permission else "view"

        # Get the highest role level
        max_role_level = max(
            (ROLE_HIERARCHY.get(role, 0) for role in roles),
            default=0,
        )

        # Simple rules:
        # - view/report: level >= 40 (nhan_vien)
        # - create: level >= 40 (nhan_vien)
        # - edit/approve: level >= 60 (leader)
        # - delete/assign: level >= 80 (truong_phong)
        action_levels = {
            "view": 40,
            "create": 40,
            "report": 40,
            "edit": 60,
            "approve": 60,
            "delete": 80,
            "assign": 80,
            "manage": 100,
        }

        required_level = action_levels.get(action, 100)
        return max_role_level >= required_level

    def _abort_forbidden(self, message: str):
        async def abort_handler(request, context):
            await context.abort(grpc.StatusCode.PERMISSION_DENIED, message)
        return grpc.unary_unary_rpc_method_handler(abort_handler)
