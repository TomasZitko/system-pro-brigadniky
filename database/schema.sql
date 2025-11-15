-- BrigadníkOS Database Schema
-- PostgreSQL 14+ with Row-Level Security for Multi-Tenancy

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =======================
-- ENUMS
-- =======================

CREATE TYPE user_role AS ENUM ('worker', 'manager', 'franchise_hq', 'accountant');
CREATE TYPE tenant_type AS ENUM ('single_location', 'franchise_parent', 'franchise_child');
CREATE TYPE contract_type AS ENUM ('dpp', 'dpc');
CREATE TYPE shift_status AS ENUM ('draft', 'open', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('scheduled', 'clocked_in', 'clocked_out', 'approved', 'disputed');
CREATE TYPE achievement_trigger_type AS ENUM ('shift_count', 'perfect_attendance', 'customer_rating', 'sales_milestone', 'custom');
CREATE TYPE feedback_rating AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE supplement_type AS ENUM ('weekend', 'night', 'holiday', 'overtime');

-- =======================
-- CORE TABLES
-- =======================

-- Tenants (Businesses/Locations)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type tenant_type NOT NULL DEFAULT 'single_location',
    parent_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Business details
    company_name VARCHAR(255) NOT NULL,
    ico VARCHAR(20),  -- Czech company ID
    dic VARCHAR(20),  -- Czech tax ID
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Location for geofencing
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geofence_radius_meters INTEGER DEFAULT 100,

    -- Subscription & limits
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    max_workers INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_parent CHECK (
        (type = 'franchise_child' AND parent_tenant_id IS NOT NULL) OR
        (type != 'franchise_child' AND parent_tenant_id IS NULL)
    )
);

CREATE INDEX idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX idx_tenants_type ON tenants(type);

-- Users (All roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Authentication
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,

    -- Personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_number VARCHAR(11),  -- Czech rodné číslo (encrypted)
    birth_date DATE,
    profile_picture_url TEXT,

    -- Address
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),

    -- Bank details
    bank_account VARCHAR(50),  -- Encrypted
    bank_code VARCHAR(10),

    -- Health insurance (required for ČSSZ)
    health_insurance_code VARCHAR(10),  -- 111=VZP, 201=VoZP, etc.

    -- Worker-specific
    preferred_hourly_rate DECIMAL(10, 2),

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,

    -- Timestamps
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT email_unique_per_tenant UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Worker availability
CREATE TABLE worker_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Recurring availability (e.g., "cannot work Tuesday mornings")
    day_of_week INTEGER,  -- 0=Sunday, 1=Monday, etc.
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,

    -- Specific date blocks (e.g., vacation)
    specific_date DATE,

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_availability_type CHECK (
        (day_of_week IS NOT NULL AND specific_date IS NULL) OR
        (day_of_week IS NULL AND specific_date IS NOT NULL)
    )
);

CREATE INDEX idx_availability_user ON worker_availability(user_id);
CREATE INDEX idx_availability_tenant ON worker_availability(tenant_id);

-- Contracts (DPP/DPČ agreements)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    contract_type contract_type NOT NULL,

    -- Contract details
    contract_number VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,

    -- Compensation
    hourly_rate DECIMAL(10, 2) NOT NULL,

    -- Document storage
    signed_document_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_worker ON contracts(worker_id);
CREATE INDEX idx_contracts_active ON contracts(is_active);

-- =======================
-- SHIFT PLANNING
-- =======================

-- Shifts
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Assignment
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_manager_id UUID NOT NULL REFERENCES users(id),

    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    -- Details
    role_name VARCHAR(100),  -- e.g., "Barista", "Server"
    hourly_rate DECIMAL(10, 2) NOT NULL,

    -- Status
    status shift_status NOT NULL DEFAULT 'draft',

    -- Notes
    notes TEXT,

    -- For marketplace
    is_open_to_marketplace BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX idx_shifts_worker ON shifts(assigned_worker_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_marketplace ON shifts(is_open_to_marketplace) WHERE is_open_to_marketplace = true;

-- Shift applications (for marketplace)
CREATE TABLE shift_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_application UNIQUE(shift_id, worker_id)
);

CREATE INDEX idx_applications_shift ON shift_applications(shift_id);
CREATE INDEX idx_applications_worker ON shift_applications(worker_id);

-- Shift templates (save recurring schedules)
CREATE TABLE shift_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by_manager_id UUID NOT NULL REFERENCES users(id),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Template data (JSON array of shift definitions)
    template_data JSONB NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_tenant ON shift_templates(tenant_id);

-- =======================
-- ATTENDANCE & TIME TRACKING
-- =======================

-- Attendance records
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Clock in/out
    clock_in_time TIMESTAMP,
    clock_in_latitude DECIMAL(10, 8),
    clock_in_longitude DECIMAL(11, 8),

    clock_out_time TIMESTAMP,
    clock_out_latitude DECIMAL(10, 8),
    clock_out_longitude DECIMAL(11, 8),

    -- Calculated
    total_hours DECIMAL(10, 2),

    -- Manual overrides by manager
    approved_hours DECIMAL(10, 2),
    approved_by_manager_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Status
    status attendance_status DEFAULT 'scheduled',

    -- Notes
    notes TEXT,
    manager_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_tenant ON attendance(tenant_id);
CREATE INDEX idx_attendance_shift ON attendance(shift_id);
CREATE INDEX idx_attendance_worker ON attendance(worker_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- =======================
-- PAYROLL & COMPLIANCE
-- =======================

-- Payroll periods
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    is_locked BOOLEAN DEFAULT false,
    locked_by_manager_id UUID REFERENCES users(id),
    locked_at TIMESTAMP,

    -- ČSSZ export tracking
    cssz_export_generated_at TIMESTAMP,
    cssz_export_file_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_period UNIQUE(tenant_id, period_start, period_end)
);

CREATE INDEX idx_payroll_periods_tenant ON payroll_periods(tenant_id);

-- Payroll calculations (final summary per worker per period)
CREATE TABLE payroll_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Hours
    total_regular_hours DECIMAL(10, 2) DEFAULT 0,
    total_weekend_hours DECIMAL(10, 2) DEFAULT 0,
    total_night_hours DECIMAL(10, 2) DEFAULT 0,
    total_holiday_hours DECIMAL(10, 2) DEFAULT 0,

    -- Base pay
    base_pay DECIMAL(10, 2) DEFAULT 0,

    -- Supplements (příplatky)
    weekend_supplement DECIMAL(10, 2) DEFAULT 0,
    night_supplement DECIMAL(10, 2) DEFAULT 0,
    holiday_supplement DECIMAL(10, 2) DEFAULT 0,

    -- Bonuses
    performance_bonus DECIMAL(10, 2) DEFAULT 0,

    -- Total
    gross_pay DECIMAL(10, 2) NOT NULL,

    -- DPP/DPČ year-to-date tracking
    ytd_hours DECIMAL(10, 2) DEFAULT 0,  -- Year-to-date hours for 300-hour limit

    -- Worker details snapshot (for ČSSZ)
    worker_birth_number VARCHAR(11),  -- Encrypted
    worker_health_insurance_code VARCHAR(10),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_payroll UNIQUE(payroll_period_id, worker_id)
);

CREATE INDEX idx_payroll_calc_period ON payroll_calculations(payroll_period_id);
CREATE INDEX idx_payroll_calc_worker ON payroll_calculations(worker_id);

-- Supplement rules (configurable per tenant)
CREATE TABLE supplement_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    supplement_type supplement_type NOT NULL,

    -- Rule definition
    percentage_increase DECIMAL(5, 2),  -- e.g., 10.00 for 10%
    fixed_amount DECIMAL(10, 2),        -- or fixed Kč per hour

    -- Conditions
    applies_from_time TIME,  -- e.g., 22:00 for night work
    applies_to_time TIME,    -- e.g., 06:00
    applies_on_day INTEGER,  -- 0=Sunday, 6=Saturday

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supplement_rules_tenant ON supplement_rules(tenant_id);

-- Czech public holidays (for automatic supplement calculation)
CREATE TABLE public_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL
);

-- Pre-populate Czech holidays
INSERT INTO public_holidays (date, name, year) VALUES
('2024-01-01', 'Nový rok', 2024),
('2024-03-29', 'Velký pátek', 2024),
('2024-04-01', 'Velikonoční pondělí', 2024),
('2024-05-01', 'Svátek práce', 2024),
('2024-05-08', 'Den vítězství', 2024),
('2024-07-05', 'Den slovanských věrozvěstů Cyrila a Metoděje', 2024),
('2024-07-06', 'Den upálení mistra Jana Husa', 2024),
('2024-09-28', 'Den české státnosti', 2024),
('2024-10-28', 'Den vzniku samostatného československého státu', 2024),
('2024-11-17', 'Den boje za svobodu a demokracii', 2024),
('2024-12-24', 'Štědrý den', 2024),
('2024-12-25', '1. svátek vánoční', 2024),
('2024-12-26', '2. svátek vánoční', 2024),
('2025-01-01', 'Nový rok', 2025),
('2025-04-18', 'Velký pátek', 2025),
('2025-04-21', 'Velikonoční pondělí', 2025),
('2025-05-01', 'Svátek práce', 2025),
('2025-05-08', 'Den vítězství', 2025),
('2025-07-05', 'Den slovanských věrozvěstů Cyrila a Metoděje', 2025),
('2025-07-06', 'Den upálení mistra Jana Husa', 2025),
('2025-09-28', 'Den české státnosti', 2025),
('2025-10-28', 'Den vzniku samostatného československého státu', 2025),
('2025-11-17', 'Den boje za svobodu a demokracii', 2025),
('2025-12-24', 'Štědrý den', 2025),
('2025-12-25', '1. svátek vánoční', 2025),
('2025-12-26', '2. svátek vánoční', 2025);

-- =======================
-- GAMIFICATION
-- =======================

-- Achievement definitions
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,

    -- Trigger logic
    trigger_type achievement_trigger_type NOT NULL,
    trigger_condition JSONB NOT NULL,  -- e.g., {"shift_count": 10, "on_time": true}

    -- Points/rewards
    points INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_tenant ON achievements(tenant_id);

-- Worker achievements (earned badges)
CREATE TABLE worker_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_worker_achievement UNIQUE(worker_id, achievement_id)
);

CREATE INDEX idx_worker_achievements_worker ON worker_achievements(worker_id);
CREATE INDEX idx_worker_achievements_tenant ON worker_achievements(tenant_id);

-- Leaderboards (calculated periodically)
CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Metrics
    total_shifts INTEGER DEFAULT 0,
    total_hours DECIMAL(10, 2) DEFAULT 0,
    average_customer_rating DECIMAL(3, 2),
    total_points INTEGER DEFAULT 0,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Rank
    rank INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_leaderboard_entry UNIQUE(tenant_id, worker_id, period_start, period_end)
);

CREATE INDEX idx_leaderboard_tenant ON leaderboard_entries(tenant_id);
CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period_start, period_end);

-- =======================
-- CUSTOMER FEEDBACK
-- =======================

-- Feedback QR codes
CREATE TABLE feedback_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Link to specific worker (optional)
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Unique code for the QR
    qr_code VARCHAR(50) NOT NULL UNIQUE,
    qr_image_url TEXT,

    -- Display settings
    label VARCHAR(255),  -- e.g., "Rate your service", "How was Jana?"

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_codes_tenant ON feedback_qr_codes(tenant_id);
CREATE INDEX idx_qr_codes_worker ON feedback_qr_codes(worker_id);
CREATE INDEX idx_qr_codes_code ON feedback_qr_codes(qr_code);

-- Customer feedback
CREATE TABLE customer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    qr_code_id UUID NOT NULL REFERENCES feedback_qr_codes(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Rating
    rating feedback_rating NOT NULL,

    -- Comments (pre-set buttons)
    tags TEXT[],  -- e.g., ["Friendly Smile", "Fast Service"]

    -- Free text (optional)
    comment TEXT,

    -- Metadata
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_tenant ON customer_feedback(tenant_id);
CREATE INDEX idx_feedback_worker ON customer_feedback(worker_id);
CREATE INDEX idx_feedback_qr ON customer_feedback(qr_code_id);
CREATE INDEX idx_feedback_rating ON customer_feedback(rating);
CREATE INDEX idx_feedback_created ON customer_feedback(created_at);

-- =======================
-- INTEGRATIONS
-- =======================

-- POS integrations
CREATE TABLE pos_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    provider VARCHAR(50) NOT NULL,  -- 'dotykacka', 'syrve', 'awis'

    -- Credentials (encrypted)
    api_key TEXT,
    api_secret TEXT,
    webhook_secret TEXT,

    -- Config
    config JSONB,

    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pos_integrations_tenant ON pos_integrations(tenant_id);

-- POS sales data (synced from external systems)
CREATE TABLE pos_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Sale details
    sale_id VARCHAR(255),  -- External POS sale ID
    sale_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(10, 2),

    -- Raw data from POS
    raw_data JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pos_sales_tenant ON pos_sales(tenant_id);
CREATE INDEX idx_pos_sales_worker ON pos_sales(worker_id);
CREATE INDEX idx_pos_sales_date ON pos_sales(sale_date);

-- API keys (for external systems to access our API)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,

    -- Permissions
    scopes TEXT[],  -- e.g., ["payroll:read", "workers:read"]

    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- =======================
-- NOTIFICATIONS
-- =======================

-- Notification settings
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Channels
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,

    -- Event types
    shift_assigned BOOLEAN DEFAULT true,
    shift_reminder BOOLEAN DEFAULT true,
    shift_application_status BOOLEAN DEFAULT true,
    customer_feedback BOOLEAN DEFAULT true,
    achievement_earned BOOLEAN DEFAULT true,
    payroll_ready BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT one_setting_per_user UNIQUE(user_id)
);

-- Notification queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Payload for deep linking
    payload JSONB,

    -- Status
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =======================
-- AUDIT LOG
-- =======================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,

    -- Changes
    old_values JSONB,
    new_values JSONB,

    -- Request metadata
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- =======================
-- ROW-LEVEL SECURITY
-- =======================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies (examples - will be created by backend on user context)

-- Workers can only see their own data
CREATE POLICY worker_own_data ON users
    FOR ALL
    USING (
        id = current_setting('app.current_user_id', true)::UUID
        AND role = 'worker'
    );

-- Managers can see all data in their tenant
CREATE POLICY manager_tenant_data ON users
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::UUID
        AND current_setting('app.current_user_role', true) = 'manager'
    );

-- Franchise HQ can READ across child tenants
CREATE POLICY franchise_hq_read ON users
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT id FROM tenants
            WHERE parent_tenant_id = current_setting('app.current_tenant_id', true)::UUID
        )
        AND current_setting('app.current_user_role', true) = 'franchise_hq'
    );

-- Accountant can only access payroll data
CREATE POLICY accountant_payroll_access ON payroll_calculations
    FOR SELECT
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::UUID
        AND current_setting('app.current_user_role', true) = 'accountant'
    );

-- =======================
-- FUNCTIONS & TRIGGERS
-- =======================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate total hours on attendance
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_in_time IS NOT NULL AND NEW.clock_out_time IS NOT NULL THEN
        NEW.total_hours = EXTRACT(EPOCH FROM (NEW.clock_out_time - NEW.clock_in_time)) / 3600.0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_hours BEFORE INSERT OR UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION calculate_attendance_hours();

-- =======================
-- VIEWS
-- =======================

-- Worker dashboard view (combines all relevant data)
CREATE OR REPLACE VIEW worker_dashboard AS
SELECT
    u.id as worker_id,
    u.tenant_id,
    u.first_name,
    u.last_name,
    u.profile_picture_url,
    COUNT(DISTINCT s.id) as total_shifts,
    COALESCE(SUM(a.approved_hours), 0) as total_hours_worked,
    COALESCE(AVG(cf.rating::INTEGER), 0) as average_customer_rating,
    COUNT(DISTINCT wa.id) as achievements_earned,
    COALESCE(le.total_points, 0) as total_points,
    COALESCE(le.rank, 999) as current_rank
FROM users u
LEFT JOIN shifts s ON s.assigned_worker_id = u.id
LEFT JOIN attendance a ON a.worker_id = u.id AND a.status = 'approved'
LEFT JOIN customer_feedback cf ON cf.worker_id = u.id
LEFT JOIN worker_achievements wa ON wa.worker_id = u.id
LEFT JOIN leaderboard_entries le ON le.worker_id = u.id
    AND le.period_start <= CURRENT_DATE
    AND le.period_end >= CURRENT_DATE
WHERE u.role = 'worker'
GROUP BY u.id, u.tenant_id, u.first_name, u.last_name, u.profile_picture_url, le.total_points, le.rank;

-- Manager analytics view
CREATE OR REPLACE VIEW manager_analytics AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(DISTINCT CASE WHEN u.role = 'worker' THEN u.id END) as total_workers,
    COUNT(DISTINCT s.id) as total_shifts,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_shifts,
    COALESCE(SUM(a.approved_hours), 0) as total_hours,
    COALESCE(AVG(cf.rating::INTEGER), 0) as average_customer_satisfaction,
    COUNT(DISTINCT cf.id) as total_customer_reviews
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
LEFT JOIN shifts s ON s.tenant_id = t.id
LEFT JOIN attendance a ON a.tenant_id = t.id AND a.status = 'approved'
LEFT JOIN customer_feedback cf ON cf.tenant_id = t.id
GROUP BY t.id, t.name;

-- DPP hour tracking view (for 300-hour limit)
CREATE OR REPLACE VIEW dpp_hour_tracking AS
SELECT
    c.worker_id,
    c.tenant_id,
    EXTRACT(YEAR FROM a.clock_in_time) as year,
    SUM(a.approved_hours) as total_hours_ytd,
    300 - COALESCE(SUM(a.approved_hours), 0) as remaining_hours
FROM contracts c
JOIN attendance a ON a.worker_id = c.worker_id
WHERE c.contract_type = 'dpp'
    AND c.is_active = true
    AND a.status = 'approved'
GROUP BY c.worker_id, c.tenant_id, EXTRACT(YEAR FROM a.clock_in_time);

-- =======================
-- SEED DATA (for development)
-- =======================

-- Create a demo tenant
INSERT INTO tenants (id, name, type, company_name, ico, email, latitude, longitude) VALUES
('00000000-0000-0000-0000-000000000001', 'Tudlo Café - Národní', 'single_location', 'Tudlo s.r.o.', '12345678', 'manager@tudlo.cz', 50.0833, 14.4236);

-- Create a demo manager (password: "manager123")
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'manager@tudlo.cz', '$2b$10$rZ7JKjZ7Z7Z7Z7Z7Z7Z7ZeYJKjZ7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z', 'manager', 'Jan', 'Novák');

-- Create demo workers
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, birth_number, health_insurance_code, bank_account, bank_code) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'jana@example.cz', '$2b$10$rZ7JKjZ7Z7Z7Z7Z7Z7Z7ZeYJKjZ7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z', 'worker', 'Jana', 'Svobodová', '9556234567', '111', '1234567890', '0100'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'petr@example.cz', '$2b$10$rZ7JKjZ7Z7Z7Z7Z7Z7Z7ZeYJKjZ7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z', 'worker', 'Petr', 'Dvořák', '8801123456', '111', '9876543210', '0100');

-- Create demo achievements
INSERT INTO achievements (tenant_id, name, description, trigger_type, trigger_condition, points, icon_url) VALUES
('00000000-0000-0000-0000-000000000001', 'Shift Samurai', 'Complete 10 shifts on time', 'shift_count', '{"shift_count": 10, "on_time": true}', 100, 'https://example.com/icons/samurai.png'),
('00000000-0000-0000-0000-000000000001', '5-Star Master', 'Receive 10 five-star reviews', 'customer_rating', '{"five_star_count": 10}', 150, 'https://example.com/icons/star.png');

COMMENT ON DATABASE brigadnikos IS 'BrigadníkOS - All-in-One Czech Workforce Platform';
