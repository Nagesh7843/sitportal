-- =============================================================================
-- SITCOE Institutional Portal & Scale Alpha — Complete Neon DB Migration Script
-- Database Engine: PostgreSQL (Neon DB / Supabase / AWS RDS / Local Postgres)
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USERS & ACCOUNTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT', -- ADMIN, HOD, FACULTY, STUDENT, PARENT, PUBLIC
    role_title VARCHAR(100) DEFAULT 'Member',
    department VARCHAR(255) DEFAULT 'Computer Science & Engineering',
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. CENTRAL CIRCULAR NOTICES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'GENERAL', -- General, Exam, Event, Academic, Emergency
    priority VARCHAR(50) DEFAULT 'NORMAL',   -- URGENT, HIGH, NORMAL, LOW
    status VARCHAR(50) DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, ARCHIVED
    target_audience JSONB DEFAULT '{"role":["all"]}'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    read_by JSONB DEFAULT '[]'::jsonb,
    views_count INT DEFAULT 0,
    published_at VARCHAR(100) DEFAULT 'Just now',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. ACADEMIC CALENDARS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_calendars (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    academic_year VARCHAR(100) NOT NULL,
    semester VARCHAR(100),
    semester_type VARCHAR(100) DEFAULT 'EVEN',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. ACADEMIC CALENDAR MILESTONE EVENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    calendar_id INT REFERENCES academic_calendars(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(100) NOT NULL, -- EXAM, ASSIGNMENT, PROJECT_REVIEW, WORKSHOP, FEST, HOLIDAY, MEETING, RESULT, GENERAL
    target_audience VARCHAR(100) DEFAULT 'ALL',
    is_notice_planned BOOLEAN DEFAULT FALSE,
    days_before_notice INT DEFAULT 7,
    notice_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, GENERATED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. STUDENTS DIRECTORY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    roll_no VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    year VARCHAR(50) NOT NULL, -- FE, SE, TE, BE
    division VARCHAR(50) DEFAULT 'Div A',
    batch VARCHAR(50) DEFAULT 'A1',
    parent_name VARCHAR(255),
    parent_phone VARCHAR(50),
    parent_email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    village_city VARCHAR(100),
    taluka VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Maharashtra',
    pin_code VARCHAR(6),
    country VARCHAR(100) DEFAULT 'India',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS village_city VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS taluka VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Maharashtra';
ALTER TABLE students ADD COLUMN IF NOT EXISTS pin_code VARCHAR(6);
ALTER TABLE students ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';

-- -----------------------------------------------------------------------------
-- 6. PARENTS & GUARDIANS DIRECTORY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    parent_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    student_roll_no VARCHAR(100) REFERENCES students(roll_no) ON DELETE SET NULL,
    relationship VARCHAR(100) DEFAULT 'Parent/Guardian',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. FACULTY MEMBERS DIRECTORY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255) DEFAULT 'Computer Science & Engineering',
    designation VARCHAR(255) NOT NULL,
    rank_title VARCHAR(100) DEFAULT 'Assistant Professor',
    qualification VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ON CAMPUS', -- ON CAMPUS, IN LAB, IN MEETING, OFF CAMPUS
    office_hours VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. CONTACT FORM & CLIENT DESK INQUIRIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, RESOLVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. DOCUMENTS & ACADEMIC MATERIAL LIBRARY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'PDF',
    file_size VARCHAR(50),
    download_url TEXT NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 10. CENTRAL Q&A DISCUSSION FORUM TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    text TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    answer_count INT DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 11. BULK EMAIL TRANSMISSION AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(500) NOT NULL,
    recipient_group VARCHAR(255) NOT NULL,
    recipient_count INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'SENT', -- SENT, SIMULATED, FAILED, NO_RECIPIENTS
    sent_by VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 12. SYSTEM ACTIVITY AUDIT TRAIL STREAM TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle TEXT,
    icon VARCHAR(100) DEFAULT 'notifications',
    type VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- PERFORMANCE OPTIMIZATION INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date, end_date);

-- -----------------------------------------------------------------------------
-- 13. PLACEMENT METRICS, RECRUITERS & DRIVES (WITH LOGO SUPPORT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placement_stats (
    id BIGSERIAL PRIMARY KEY,
    highest_package VARCHAR(100),
    average_package VARCHAR(100),
    placement_ratio VARCHAR(50),
    total_offers VARCHAR(50),
    batch_year VARCHAR(50),
    banner_image_url TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE placement_stats ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE placement_stats ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS placement_recruiters (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    package_band VARCHAR(100),
    role_tag VARCHAR(100),
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE placement_recruiters ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE placement_recruiters ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);
ALTER TABLE placement_recruiters ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS placement_drives (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    package_lpa VARCHAR(50),
    drive_date VARCHAR(50),
    eligibility TEXT,
    location VARCHAR(150),
    apply_deadline VARCHAR(50),
    status VARCHAR(50) DEFAULT 'UPCOMING',
    logo_url VARCHAR(500),
    banner_image_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE placement_drives ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE placement_drives ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE placement_drives ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS placed_students_achievements (
    id BIGSERIAL PRIMARY KEY,
    student_name VARCHAR(150) NOT NULL,
    prn VARCHAR(50),
    division VARCHAR(20),
    photo_url TEXT,
    company_name VARCHAR(150) NOT NULL,
    company_logo_url VARCHAR(500),
    role VARCHAR(150),
    package_lpa VARCHAR(50),
    batch_year VARCHAR(50),
    placed_date VARCHAR(50),
    banner_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE placed_students_achievements ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE placed_students_achievements ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500);
ALTER TABLE placed_students_achievements ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    active_department VARCHAR(100) DEFAULT 'Computer Science & Engineering',
    academic_year VARCHAR(50) DEFAULT '2025-2026',
    scraper_interval VARCHAR(20) DEFAULT '30',
    retention_days VARCHAR(20) DEFAULT '20',
    push_on_scrape BOOLEAN DEFAULT TRUE,
    sound_alerts BOOLEAN DEFAULT TRUE,
    email_alerts BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notice_reads (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT NOT NULL,
    user_identifier VARCHAR(150) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 23. STUDENT ENROLLMENTS & ACADEMIC DATA TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    academic_year_id BIGINT,
    department_id BIGINT,
    program_id BIGINT,
    year_level VARCHAR(20) NOT NULL, -- FE, SE, TE, BE
    semester_id BIGINT,
    division_id BIGINT,
    batch_id BIGINT,
    is_current BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'ENROLLED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_academic_data (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) UNIQUE NOT NULL,
    cgpa NUMERIC(4, 2) DEFAULT 0.00,
    tenth_percentage NUMERIC(5, 2) DEFAULT 0.00,
    twelfth_percentage NUMERIC(5, 2) DEFAULT 0.00,
    diploma_percentage NUMERIC(5, 2) DEFAULT 0.00,
    qualification_path VARCHAR(20) DEFAULT '12TH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_change_requests (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    verified_by_user_id BIGINT,
    verified_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 24. FACULTY BATCH ASSIGNMENTS & PARENT RELATIONSHIPS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_batch_assignments (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT REFERENCES faculty(id) ON DELETE CASCADE,
    batch_id BIGINT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_student_relationships (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES parents(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'Parent/Guardian',
    status VARCHAR(20) DEFAULT 'VERIFIED',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 25. NOTIFICATION TARGETS & RECIPIENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_targets (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    scope_type VARCHAR(50) NOT NULL,
    scope_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(150),
    delivery_status VARCHAR(30) DEFAULT 'DELIVERED',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 26. PLACEMENT ELIGIBILITY RULES & RESULTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placement_eligibility_rules (
    id BIGSERIAL PRIMARY KEY,
    placement_drive_id BIGINT REFERENCES placement_drives(id) ON DELETE CASCADE,
    minimum_cgpa NUMERIC(4, 2) DEFAULT 6.00,
    minimum_tenth_percentage NUMERIC(5, 2) DEFAULT 60.00,
    minimum_twelfth_percentage NUMERIC(5, 2) DEFAULT 60.00,
    minimum_diploma_percentage NUMERIC(5, 2) DEFAULT 60.00,
    allowed_departments VARCHAR(255) DEFAULT 'CSE,AIDS,MECH,CIVIL,ENTC,ELECTRICAL,MECHATRONICS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_eligibility_results (
    id BIGSERIAL PRIMARY KEY,
    placement_drive_id BIGINT REFERENCES placement_drives(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    is_eligible BOOLEAN NOT NULL,
    evaluation_reason TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 27. SYSTEM AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    user_email VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    result VARCHAR(50) DEFAULT 'SUCCESS',
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 28. DEVICE NOTICE DELIVERIES (PER-DEVICE EXACTLY-ONCE DEDUPLICATION)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_notice_deliveries (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    device_endpoint VARCHAR(1000) NOT NULL,
    user_email VARCHAR(150),
    device_type VARCHAR(100) DEFAULT 'Web Browser',
    delivery_status VARCHAR(30) DEFAULT 'DELIVERED',
    idempotency_key VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notice_device_delivery UNIQUE(notice_id, device_endpoint)
);

-- Production Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_enrollments_prn ON student_enrollments(prn, is_current);
CREATE INDEX IF NOT EXISTS idx_student_academic_prn ON student_academic_data(prn);
CREATE INDEX IF NOT EXISTS idx_faculty_batch_fac ON faculty_batch_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_notification_recip_user ON notification_recipients(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_placement_eval_drive ON placement_eligibility_results(placement_drive_id, is_eligible);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON system_audit_logs(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_deliveries_notice ON device_notice_deliveries(notice_id);
CREATE INDEX IF NOT EXISTS idx_device_deliveries_endpoint ON device_notice_deliveries(device_endpoint);
CREATE INDEX IF NOT EXISTS idx_device_deliveries_email ON device_notice_deliveries(user_email);




