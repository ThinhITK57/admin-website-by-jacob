```sql
-- =============================================
-- SQL SEED DATA BAN ĐẦU - Admin Platform (Mini CRM)
-- Database: PostgreSQL 16+
-- Phiên bản: 1.0
-- Ngày: 11/04/2026
-- Mục đích: Chạy SAU khi đã chạy schema.sql để có dữ liệu mẫu sẵn dùng
-- =============================================

-- =============================================
-- 1. SEED ROLES (4 vai trò chính theo spec)
-- =============================================
INSERT INTO roles (name, guard_name, description, created_by) VALUES
('super_admin', 'web', 'Toàn quyền hệ thống - Quản trị viên cao nhất', NULL),
('truong_phong', 'web', 'Trưởng phòng - Quản lý toàn bộ team', NULL),
('leader', 'web', 'Leader / Trưởng nhóm - Quản lý team mình', NULL),
('nhan_vien', 'web', 'Nhân viên Sale / Marketing - Quyền cơ bản', NULL)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. SEED PERMISSIONS (Danh sách granular theo spec RBAC)
-- =============================================
INSERT INTO permissions (name, guard_name, description, created_by) VALUES
-- Core User & RBAC
('user.view', 'web', 'Xem danh sách người dùng', NULL),
('user.create', 'web', 'Tạo người dùng mới', NULL),
('user.edit', 'web', 'Chỉnh sửa người dùng', NULL),
('user.delete', 'web', 'Xóa người dùng', NULL),
('role.view', 'web', 'Xem danh sách Role', NULL),
('role.create', 'web', 'Tạo Role', NULL),
('role.edit', 'web', 'Chỉnh sửa Role', NULL),
('role.delete', 'web', 'Xóa Role', NULL),
('permission.assign', 'web', 'Gán quyền cho Role/User', NULL),

-- Telesale Module
('sale.view', 'web', 'Xem danh sách Sale & Lead', NULL),
('sale.create', 'web', 'Tạo Lead / Call mới', NULL),
('sale.edit', 'web', 'Chỉnh sửa Lead / Opportunity', NULL),
('sale.delete', 'web', 'Xóa Lead', NULL),
('sale.report', 'web', 'Xem báo cáo hiệu suất Sale', NULL),

-- Marketing / Ads Module
('campaign.view', 'web', 'Xem danh sách Campaign', NULL),
('campaign.create', 'web', 'Tạo Campaign mới', NULL),
('campaign.edit', 'web', 'Chỉnh sửa Campaign', NULL),
('campaign.delete', 'web', 'Xóa Campaign', NULL),
('campaign.approve', 'web', 'Duyệt Campaign', NULL),
('campaign.report', 'web', 'Xem báo cáo Ads & Metrics', NULL),

-- Dashboard & Report chung
('dashboard.view', 'web', 'Xem Dashboard tổng quan', NULL),
('report.export', 'web', 'Export Excel/CSV báo cáo', NULL),

-- Audit & System
('audit.view', 'web', 'Xem Activity Log', NULL)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 3. GÁN PERMISSIONS VÀO ROLES
-- =============================================
-- Super Admin: Toàn bộ quyền
INSERT INTO role_has_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Trưởng phòng: Hầu hết quyền trừ quản lý User/Role
INSERT INTO role_has_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'truong_phong'
AND p.name NOT IN ('user.create', 'user.delete', 'role.create', 'role.delete', 'permission.assign')
ON CONFLICT DO NOTHING;

-- Leader: Quyền team mình + sale + report
INSERT INTO role_has_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'leader'
AND p.name IN ('sale.view', 'sale.create', 'sale.edit', 'sale.report',
               'campaign.view', 'campaign.report', 'dashboard.view', 'report.export')
ON CONFLICT DO NOTHING;

-- Nhân viên: Chỉ xem & tạo cơ bản
INSERT INTO role_has_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'nhan_vien'
AND p.name IN ('sale.view', 'sale.create', 'campaign.view', 'dashboard.view')
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. SEED TEAMS
-- =============================================
INSERT INTO teams (name, description, created_by) VALUES
('Team Sale Telesale 1', 'Đội telesale chuyên lead Facebook', NULL),
('Team Marketing Ads', 'Đội chạy ads Facebook & Google', NULL)
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. SEED USERS (Mật khẩu mặc định: password)
-- Hash bcrypt cho "password" (Laravel / PHP chuẩn)
-- =============================================
-- Super Admin
INSERT INTO users (name, email, password_hash, status, avatar, created_by)
VALUES ('Super Admin', 'admin@company.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

-- Leader Sale
INSERT INTO users (name, email, password_hash, status, team_id, created_by)
VALUES ('Nguyễn Văn Leader', 'leader.sale@company.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 
        (SELECT id FROM teams WHERE name = 'Team Sale Telesale 1' LIMIT 1), 
        (SELECT id FROM users WHERE email = 'admin@company.vn' LIMIT 1))
ON CONFLICT (email) DO NOTHING;

-- Nhân viên Sale
INSERT INTO users (name, email, password_hash, status, team_id, created_by)
VALUES ('Trần Thị Sale1', 'sale1@company.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 
        (SELECT id FROM teams WHERE name = 'Team Sale Telesale 1' LIMIT 1), 
        (SELECT id FROM users WHERE email = 'admin@company.vn' LIMIT 1))
ON CONFLICT (email) DO NOTHING;

-- Nhân viên Marketing
INSERT INTO users (name, email, password_hash, status, team_id, created_by)
VALUES ('Lê Văn Ads', 'ads@company.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 
        (SELECT id FROM teams WHERE name = 'Team Marketing Ads' LIMIT 1), 
        (SELECT id FROM users WHERE email = 'admin@company.vn' LIMIT 1))
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 6. GÁN ROLE CHO USERS (model_has_roles)
-- =============================================
INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    'App\\Models\\User',
    (SELECT id FROM users WHERE email = 'admin@company.vn')
ON CONFLICT DO NOTHING;

INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'leader'),
    'App\\Models\\User',
    (SELECT id FROM users WHERE email = 'leader.sale@company.vn')
ON CONFLICT DO NOTHING;

INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'nhan_vien'),
    'App\\Models\\User',
    (SELECT id FROM users WHERE email = 'sale1@company.vn')
ON CONFLICT DO NOTHING;

INSERT INTO model_has_roles (role_id, model_type, model_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'nhan_vien'),
    'App\\Models\\User',
    (SELECT id FROM users WHERE email = 'ads@company.vn')
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. SEED DỮ LIỆU MẪU (Telesale & Ads) - Để test ngay
-- =============================================

-- Sale Staff bổ sung
INSERT INTO sale_staff (user_id, target_revenue_monthly, commission_rate)
VALUES 
    ((SELECT id FROM users WHERE email = 'sale1@company.vn'), 50000000, 5.0),
    ((SELECT id FROM users WHERE email = 'leader.sale@company.vn'), 120000000, 8.0)
ON CONFLICT DO NOTHING;

-- Sample Leads
INSERT INTO leads (name, phone, email, source, status, assigned_to, team_id, created_by)
VALUES 
    ('Khách hàng A', '0987654321', 'khachA@gmail.com', 'facebook', 'new', 
     (SELECT id FROM users WHERE email = 'sale1@company.vn'), 
     (SELECT id FROM teams WHERE name = 'Team Sale Telesale 1' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@company.vn')),
    ('Khách hàng B', '0912345678', 'khachB@gmail.com', 'google', 'contacted', 
     (SELECT id FROM users WHERE email = 'sale1@company.vn'), 
     (SELECT id FROM teams WHERE name = 'Team Sale Telesale 1' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@company.vn'))
ON CONFLICT DO NOTHING;

-- Sample Campaign
INSERT INTO campaigns (name, budget, start_date, end_date, channel, status, owner_id, created_by)
VALUES 
    ('Campaign Tết 2026 - Facebook Lead', 50000000, '2026-04-01', '2026-04-30', 'facebook', 'active', 
     (SELECT id FROM users WHERE email = 'ads@company.vn'),
     (SELECT id FROM users WHERE email = 'admin@company.vn'))
ON CONFLICT DO NOTHING;

-- Sample Campaign Metrics (ngày hôm nay)
INSERT INTO campaign_metrics (campaign_id, date, impressions, clicks, cost, conversions, revenue)
VALUES 
    ((SELECT id FROM campaigns WHERE name = 'Campaign Tết 2026 - Facebook Lead' LIMIT 1), 
     CURRENT_DATE, 12500, 320, 4500000, 18, 12500000)
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. HOÀN TẤT - Thông báo
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ SEED DATA BAN ĐẦU HOÀN TẤT!';
    RAISE NOTICE '   - Super Admin: admin@company.vn / password';
    RAISE NOTICE '   - Leader Sale: leader.sale@company.vn / password';
    RAISE NOTICE '   - Nhân viên Sale: sale1@company.vn / password';
    RAISE NOTICE '   - Nhân viên Ads: ads@company.vn / password';
    RAISE NOTICE 'Bạn có thể đăng nhập và test toàn bộ RBAC ngay!';
END $$;

-- =============================================
-- CÁCH CHẠY:
-- 1. Chạy schema.sql trước
-- 2. Chạy script seed này (copy toàn bộ)
-- 3. Kết nối backend (Laravel/NestJS) → login với tài khoản admin
-- =============================================
```

**Hướng dẫn nhanh:**
- Copy toàn bộ script trên → paste vào **pgAdmin** hoặc chạy lệnh `psql -U user -d admin_crm -f seed_data.sql`
- Mật khẩu mặc định cho **tất cả tài khoản** là: `password`
- Sau khi seed xong, bạn đã có đầy đủ:
  - RBAC hoàn chỉnh
  - Dữ liệu mẫu để test Dashboard, Telesale, Ads
  - Team & phân quyền sẵn

Bạn muốn tôi bổ sung thêm seed nào không?
- Thêm 10 leads + 20 calls mẫu?
- Seed cho Opportunity & Deal?
- Hoặc script reset + reseed (cho dev local)?

Reply “thêm calls”, “seed opportunity”, “mysql version”… tôi xuất ngay! 🚀