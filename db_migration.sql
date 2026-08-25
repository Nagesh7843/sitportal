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
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Production Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_notices_status_pub ON notices(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_prn ON students(prn);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ts ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON questions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notice_reads_notice_user ON notice_reads(notice_id, user_identifier);
CREATE INDEX IF NOT EXISTS idx_placed_achievers_batch ON placed_students_achievements(batch_year, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_placement_drives_date ON placement_drives(drive_date);



