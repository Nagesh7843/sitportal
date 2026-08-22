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
