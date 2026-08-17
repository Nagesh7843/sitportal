-- PostgreSQL Schema for sitportaldb (Communication Portal)

-- 1. Departments Table (Multi-department ready)
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL
);

-- Seed default department
INSERT INTO departments (code, name) 
VALUES ('CSE', 'Computer Science & Engineering')
ON CONFLICT (code) DO NOTHING;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    avatar_url VARCHAR(500),
    department VARCHAR(50) DEFAULT 'CSE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    roll_no VARCHAR(30) UNIQUE NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    division VARCHAR(10) NOT NULL,
    batch_group VARCHAR(10) NOT NULL,
    cohort_batch VARCHAR(20) NOT NULL,
    attendance NUMERIC(5, 2) DEFAULT 90.00,
    gpa NUMERIC(3, 2) DEFAULT 3.50,
    status VARCHAR(20) DEFAULT 'Active'
);

-- 4. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(150) NOT NULL,
    rank_title VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'ON CAMPUS',
    office_hours VARCHAR(100),
    publications_count INT DEFAULT 0
);

-- 5. Notices Table (Official Central Notice Board with Auto-Expiry & Delete Support)
CREATE TABLE IF NOT EXISTS notices (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, SCHEDULED
    target_years VARCHAR(100),
    target_divisions VARCHAR(100),
    target_batches VARCHAR(100),
    published_at VARCHAR(100) NOT NULL,
    scheduled_at VARCHAR(100),
    expires_at VARCHAR(100), -- Auto-deletion timestamp or timer
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notice Attachments Table
CREATE TABLE IF NOT EXISTS notice_attachments (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500),
    file_size VARCHAR(50) NOT NULL,
    category VARCHAR(50) DEFAULT 'Notice'
);

-- 7. Notice Reads Table
CREATE TABLE IF NOT EXISTS notice_reads (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    user_id_str VARCHAR(100) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notice_user_read UNIQUE(notice_id, user_id_str)
);

-- 8. Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGSERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    recipient_group VARCHAR(150) NOT NULL,
    recipient_count INT NOT NULL,
    recipient_emails TEXT,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    open_rate VARCHAR(20) DEFAULT 'Not available',
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. FCM Tokens Table (Push Notifications)
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(120) NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    device_type VARCHAR(50) DEFAULT 'Web Browser',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    time_ago VARCHAR(50) DEFAULT 'Just now',
    icon VARCHAR(50) DEFAULT 'campaign',
    type VARCHAR(50) DEFAULT 'notice',
    color_bg VARCHAR(50) DEFAULT 'bg-[#d9e2ff]',
    color_icon VARCHAR(50) DEFAULT 'text-[#00429c]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. System Notifications Table
CREATE TABLE IF NOT EXISTS system_notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_role VARCHAR(50) DEFAULT 'ALL',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
