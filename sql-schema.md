```sql
-- =============================================
-- SQL SCHEMA CHI TIẾT - Admin Platform (Mini CRM)
-- Database: PostgreSQL 16+
-- Phiên bản: 1.0
-- Ngày: 11/04/2026
-- Mục đích: Dùng trực tiếp để tạo database (copy-paste vào pgAdmin hoặc psql)
-- =============================================

-- 1. TẠO ENUM (nếu dùng PostgreSQL enum)
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted');
CREATE TYPE deal_status AS ENUM ('pending', 'won', 'lost');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
CREATE TYPE ad_channel AS ENUM ('facebook', 'google', 'tiktok', 'youtube', 'other');

-- =============================================
-- 2. CORE TABLES (User + RBAC)
-- =============================================

-- Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar VARCHAR(512),
    phone VARCHAR(50),
    status user_status DEFAULT 'active',
    team_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Teams
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    leader_id BIGINT REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,           -- ví dụ: 'nhan_vien', 'leader', 'truong_phong', 'super_admin'
    guard_name VARCHAR(100) DEFAULT 'web',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id)
);

-- Permissions (granular)
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,           -- ví dụ: 'sale.view', 'campaign.approve', 'user.manage'
    guard_name VARCHAR(100) DEFAULT 'web',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id)
);

-- Pivot: Role - Permission
CREATE TABLE role_has_permissions (
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (permission_id, role_id)
);

-- Pivot: User - Role (hỗ trợ multiple roles)
CREATE TABLE model_has_roles (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    model_type VARCHAR(50) DEFAULT 'App\\Models\\User',  -- Laravel-style polymorphic
    model_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, model_id, model_type)
);

-- Index cho RBAC
CREATE INDEX idx_model_has_roles_model ON model_has_roles(model_type, model_id);
CREATE INDEX idx_users_team_id ON users(team_id);

-- =============================================
-- 3. TELE SALE MODULE
-- =============================================

-- Sale Staff (thông tin bổ sung cho user là sale)
CREATE TABLE sale_staff (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    target_revenue_monthly DECIMAL(15,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0,           -- %
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Calls
CREATE TABLE calls (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT REFERENCES users(id),
    lead_id BIGINT,
    call_time TIMESTAMPTZ NOT NULL,
    duration_seconds INT,
    result VARCHAR(50),                               -- answered, no-answer, busy, voicemail...
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id)
);

-- Leads
CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    source VARCHAR(100),                              -- facebook, google, telesale...
    status lead_status DEFAULT 'new',
    assigned_to BIGINT REFERENCES users(id),
    team_id BIGINT REFERENCES teams(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id)
);

-- Opportunities
CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT REFERENCES leads(id),
    value DECIMAL(15,2),
    stage VARCHAR(50),                                -- discovery, proposal, negotiation...
    probability INT CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id)
);

-- Deals (closed)
CREATE TABLE deals (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id),
    status deal_status DEFAULT 'pending',
    actual_revenue DECIMAL(15,2),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id)
);

-- =============================================
-- 4. ADS / MARKETING MODULE
-- =============================================

-- Campaigns
CREATE TABLE campaigns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    channel ad_channel,
    status campaign_status DEFAULT 'draft',
    owner_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id)
);

-- Ad Groups
CREATE TABLE ad_groups (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    budget DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ads (creative)
CREATE TABLE ads (
    id BIGSERIAL PRIMARY KEY,
    ad_group_id BIGINT REFERENCES ad_groups(id) ON DELETE CASCADE,
    name VARCHAR(255),
    creative_url TEXT,                                -- link hình/video
    headline VARCHAR(255),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Metrics (tích hợp từ Facebook/Google Ads)
CREATE TABLE campaign_metrics (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    cost DECIMAL(15,2) DEFAULT 0,
    conversions INT DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,                  -- attribution revenue
    UNIQUE(campaign_id, date)
);

-- =============================================
-- 5. AUDIT LOG & COMMON
-- =============================================

-- Activity Log (toàn hệ thống)
CREATE TABLE activity_log (
    id BIGSERIAL PRIMARY KEY,
    log_name VARCHAR(255),
    description TEXT,
    subject_type VARCHAR(255),
    subject_id BIGINT,
    causer_type VARCHAR(255),
    causer_id BIGINT REFERENCES users(id),
    event VARCHAR(100),
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho audit log
CREATE INDEX idx_activity_log_causer ON activity_log(causer_id);
CREATE INDEX idx_activity_log_subject ON activity_log(subject_type, subject_id);

-- =============================================
-- 6. FOREIGN KEY & INDEX THÊM
-- =============================================

ALTER TABLE users ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id);

-- =============================================
-- 7. TRIGGER TỰ ĐỘNG CẬP NHẬT updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Áp dụng trigger cho các bảng chính
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER trigger_teams_updated_at
    BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- (Bạn có thể copy-paste trigger tương tự cho các bảng khác: leads, campaigns...)

-- =============================================
-- 8. ROW LEVEL SECURITY (RBS) - Ví dụ cơ bản
-- =============================================
-- Bật RLS cho bảng users (chỉ admin xem hết)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_policy_admin ON users
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM model_has_roles mhr
        JOIN roles r ON r.id = mhr.role_id
        WHERE mhr.model_id = current_setting('app.current_user_id')::bigint
        AND r.name = 'super_admin'
    ));

-- Bạn sẽ thêm policy cho từng bảng theo role sau (sale chỉ xem data của mình...)

-- =============================================
-- 9. CÁCH CHẠY
-- =============================================
/*
1. Tạo database: CREATE DATABASE admin_crm;
2. Chạy toàn bộ script trên.
3. Seed data ban đầu:
   - Tạo Super Admin
   - Tạo các Role mặc định
   - Tạo Permission mẫu (sale.view, sale.edit, campaign.create...)