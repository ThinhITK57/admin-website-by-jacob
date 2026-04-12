"""Seed data script - populates initial roles, permissions, teams, and users.

Run after database migration:
    python -m scripts.seed_data
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from admin_crm.config.database import async_session_factory, init_db
from admin_crm.config.settings import get_settings
from admin_crm.db.models import *  # noqa: ensure all models are loaded
from admin_crm.db.repositories import (
    PermissionRepository,
    RoleRepository,
    SaleStaffRepository,
    TeamRepository,
    UserRepository,
    LeadRepository,
    CampaignRepository,
    CampaignMetricRepository,
)
from admin_crm.utils.password import hash_password
from admin_crm.utils.logger import setup_logging, get_logger

setup_logging("INFO")
logger = get_logger("seed")


async def seed_roles(session) -> dict[str, int]:
    """Seed default roles."""
    repo = RoleRepository(session)
    roles_data = [
        ("super_admin", "Toàn quyền hệ thống - Quản trị viên cao nhất"),
        ("truong_phong", "Trưởng phòng - Quản lý toàn bộ team"),
        ("leader", "Leader / Trưởng nhóm - Quản lý team mình"),
        ("nhan_vien", "Nhân viên Sale / Marketing - Quyền cơ bản"),
    ]

    role_map = {}
    for name, desc in roles_data:
        existing = await repo.get_by_name(name)
        if existing:
            role_map[name] = existing.id
            logger.info(f"  ✓ Role '{name}' already exists (id={existing.id})")
        else:
            role = await repo.create(name=name, description=desc, guard_name="web")
            role_map[name] = role.id
            logger.info(f"  + Role '{name}' created (id={role.id})")

    return role_map


async def seed_permissions(session) -> dict[str, int]:
    """Seed all granular permissions."""
    repo = PermissionRepository(session)
    permissions_data = [
        # Core User & RBAC
        ("user.view", "Xem danh sách người dùng"),
        ("user.create", "Tạo người dùng mới"),
        ("user.edit", "Chỉnh sửa người dùng"),
        ("user.delete", "Xóa người dùng"),
        ("role.view", "Xem danh sách Role"),
        ("role.create", "Tạo Role"),
        ("role.edit", "Chỉnh sửa Role"),
        ("role.delete", "Xóa Role"),
        ("permission.assign", "Gán quyền cho Role/User"),
        # Telesale
        ("sale.view", "Xem danh sách Sale & Lead"),
        ("sale.create", "Tạo Lead / Call mới"),
        ("sale.edit", "Chỉnh sửa Lead / Opportunity"),
        ("sale.delete", "Xóa Lead"),
        ("sale.report", "Xem báo cáo hiệu suất Sale"),
        # Marketing / Ads
        ("campaign.view", "Xem danh sách Campaign"),
        ("campaign.create", "Tạo Campaign mới"),
        ("campaign.edit", "Chỉnh sửa Campaign"),
        ("campaign.delete", "Xóa Campaign"),
        ("campaign.approve", "Duyệt Campaign"),
        ("campaign.report", "Xem báo cáo Ads & Metrics"),
        # Dashboard & Report
        ("dashboard.view", "Xem Dashboard tổng quan"),
        ("report.export", "Export Excel/CSV báo cáo"),
        # Audit
        ("audit.view", "Xem Activity Log"),
    ]

    perm_map = {}
    for name, desc in permissions_data:
        existing = await repo.get_by_name(name)
        if existing:
            perm_map[name] = existing.id
        else:
            perm = await repo.create(name=name, description=desc, guard_name="web")
            perm_map[name] = perm.id

    logger.info(f"  ✓ {len(perm_map)} permissions seeded")
    return perm_map


async def assign_role_permissions(session, role_map, perm_map):
    """Assign permissions to roles based on spec."""
    repo = RoleRepository(session)

    # Super Admin: ALL permissions
    all_perm_ids = list(perm_map.values())
    await repo.assign_permissions(role_map["super_admin"], all_perm_ids)
    logger.info(f"  ✓ super_admin: {len(all_perm_ids)} permissions")

    # Trưởng phòng: Hầu hết trừ quản lý User/Role
    tp_exclude = {"user.create", "user.delete", "role.create", "role.delete", "permission.assign"}
    tp_perms = [pid for name, pid in perm_map.items() if name not in tp_exclude]
    await repo.assign_permissions(role_map["truong_phong"], tp_perms)
    logger.info(f"  ✓ truong_phong: {len(tp_perms)} permissions")

    # Leader: sale + campaign view + report
    leader_perms_names = [
        "sale.view", "sale.create", "sale.edit", "sale.report",
        "campaign.view", "campaign.report",
        "dashboard.view", "report.export",
    ]
    leader_perms = [perm_map[n] for n in leader_perms_names if n in perm_map]
    await repo.assign_permissions(role_map["leader"], leader_perms)
    logger.info(f"  ✓ leader: {len(leader_perms)} permissions")

    # Nhân viên: basic view + create
    nv_perms_names = ["sale.view", "sale.create", "campaign.view", "dashboard.view"]
    nv_perms = [perm_map[n] for n in nv_perms_names if n in perm_map]
    await repo.assign_permissions(role_map["nhan_vien"], nv_perms)
    logger.info(f"  ✓ nhan_vien: {len(nv_perms)} permissions")


async def seed_teams(session) -> dict[str, int]:
    """Seed default teams."""
    repo = TeamRepository(session)
    teams_data = [
        ("Team Sale Telesale 1", "Đội telesale chuyên lead Facebook"),
        ("Team Marketing Ads", "Đội chạy ads Facebook & Google"),
    ]

    team_map = {}
    for name, desc in teams_data:
        existing_teams, _ = await repo.get_all(filters={"name": name})
        if existing_teams:
            team_map[name] = existing_teams[0].id
            logger.info(f"  ✓ Team '{name}' already exists")
        else:
            team = await repo.create(name=name, description=desc)
            team_map[name] = team.id
            logger.info(f"  + Team '{name}' created (id={team.id})")

    return team_map


async def seed_users(session, role_map, team_map) -> dict[str, int]:
    """Seed default users with roles."""
    user_repo = UserRepository(session)
    role_repo = RoleRepository(session)

    default_password = hash_password("password")

    users_data = [
        {
            "name": "Super Admin",
            "email": "admin@company.vn",
            "role": "super_admin",
            "team": None,
        },
        {
            "name": "Nguyễn Văn Leader",
            "email": "leader.sale@company.vn",
            "role": "leader",
            "team": "Team Sale Telesale 1",
        },
        {
            "name": "Trần Thị Sale1",
            "email": "sale1@company.vn",
            "role": "nhan_vien",
            "team": "Team Sale Telesale 1",
        },
        {
            "name": "Lê Văn Ads",
            "email": "ads@company.vn",
            "role": "nhan_vien",
            "team": "Team Marketing Ads",
        },
    ]

    user_map = {}
    for u in users_data:
        existing = await user_repo.get_by_email(u["email"])
        if existing:
            user_map[u["email"]] = existing.id
            logger.info(f"  ✓ User '{u['email']}' already exists")
        else:
            user = await user_repo.create(
                name=u["name"],
                email=u["email"],
                password_hash=default_password,
                status="active",
                team_id=team_map.get(u["team"]) if u["team"] else None,
            )
            user_map[u["email"]] = user.id
            logger.info(f"  + User '{u['email']}' created (id={user.id})")

        # Assign role
        role_id = role_map.get(u["role"])
        if role_id:
            await role_repo.assign_roles_to_user(
                user_map[u["email"]], [role_id]
            )

    return user_map


async def seed_sample_data(session, user_map, team_map):
    """Seed sample data for telesale and marketing."""
    from datetime import date, datetime, timezone

    # Sale Staff
    sale_repo = SaleStaffRepository(session)
    for email, target, commission in [
        ("sale1@company.vn", 50_000_000, 5.0),
        ("leader.sale@company.vn", 120_000_000, 8.0),
    ]:
        uid = user_map.get(email)
        if uid:
            existing = await sale_repo.get_by_user_id(uid)
            if not existing:
                await sale_repo.create(
                    user_id=uid,
                    target_revenue_monthly=target,
                    commission_rate=commission,
                )
                logger.info(f"  + SaleStaff for '{email}' created")

    # Leads
    lead_repo = LeadRepository(session)
    leads_data = [
        ("Khách hàng A", "0987654321", "khachA@gmail.com", "facebook", "new"),
        ("Khách hàng B", "0912345678", "khachB@gmail.com", "google", "contacted"),
        ("Khách hàng C", "0909123456", "khachC@gmail.com", "telesale", "qualified"),
        ("Khách hàng D", "0938765432", "khachD@gmail.com", "facebook", "new"),
        ("Khách hàng E", "0976543210", "khachE@gmail.com", "tiktok", "contacted"),
    ]

    sale1_id = user_map.get("sale1@company.vn")
    team_sale_id = team_map.get("Team Sale Telesale 1")

    for name, phone, email, source, status in leads_data:
        existing = await lead_repo.get_by_phone(phone)
        if not existing:
            await lead_repo.create(
                name=name, phone=phone, email=email,
                source=source, status=status,
                assigned_to=sale1_id, team_id=team_sale_id,
                created_by=user_map.get("admin@company.vn"),
            )

    logger.info(f"  ✓ {len(leads_data)} leads seeded")

    # Campaign
    campaign_repo = CampaignRepository(session)
    metric_repo = CampaignMetricRepository(session)

    campaigns_data = [
        ("Campaign Tết 2026 - Facebook Lead", 50_000_000, "facebook", "active"),
        ("Google Search - Brand Q2", 30_000_000, "google", "active"),
        ("TikTok Video Awareness", 20_000_000, "tiktok", "draft"),
    ]

    ads_user_id = user_map.get("ads@company.vn")
    admin_id = user_map.get("admin@company.vn")

    for name, budget, channel, status in campaigns_data:
        existing_campaigns, _ = await campaign_repo.get_all(filters={"name": name})
        if not existing_campaigns:
            campaign = await campaign_repo.create(
                name=name,
                budget=budget,
                start_date=date(2026, 4, 1),
                end_date=date(2026, 4, 30),
                channel=channel,
                status=status,
                owner_id=ads_user_id,
                created_by=admin_id,
            )

            # Add sample metrics for active campaigns
            if status == "active":
                await metric_repo.upsert(
                    campaign_id=campaign.id,
                    metric_date=date.today(),
                    impressions=12500,
                    clicks=320,
                    cost=4_500_000,
                    conversions=18,
                    revenue=12_500_000,
                )

    logger.info(f"  ✓ {len(campaigns_data)} campaigns seeded")


async def run_seed():
    """Run all seed operations."""
    logger.info("=" * 50)
    logger.info("🌱 STARTING SEED DATA")
    logger.info("=" * 50)

    settings = get_settings()
    logger.info(f"Database: {settings.db_host}:{settings.db_port}/{settings.db_name}")

    # Create tables if needed
    await init_db()

    async with async_session_factory() as session:
        try:
            logger.info("\n📋 Seeding Roles...")
            role_map = await seed_roles(session)

            logger.info("\n🔑 Seeding Permissions...")
            perm_map = await seed_permissions(session)

            logger.info("\n🔗 Assigning Permissions to Roles...")
            await assign_role_permissions(session, role_map, perm_map)

            logger.info("\n👥 Seeding Teams...")
            team_map = await seed_teams(session)

            logger.info("\n👤 Seeding Users...")
            user_map = await seed_users(session, role_map, team_map)

            logger.info("\n📊 Seeding Sample Data...")
            await seed_sample_data(session, user_map, team_map)

            await session.commit()

            logger.info("\n" + "=" * 50)
            logger.info("✅ SEED DATA COMPLETED!")
            logger.info("=" * 50)
            logger.info("\nDefault accounts (password: 'password'):")
            logger.info("  👑 Super Admin:    admin@company.vn")
            logger.info("  👔 Leader Sale:    leader.sale@company.vn")
            logger.info("  👷 Nhân viên Sale: sale1@company.vn")
            logger.info("  📢 Nhân viên Ads:  ads@company.vn")

        except Exception as e:
            await session.rollback()
            logger.error(f"❌ Seed failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(run_seed())
