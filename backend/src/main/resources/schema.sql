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
    name VARCHAR(150),
    email VARCHAR(150),
    roll_no VARCHAR(30) UNIQUE NOT NULL,
    prn VARCHAR(50),
    academic_year VARCHAR(10) NOT NULL,
    division VARCHAR(10) NOT NULL,
    batch_group VARCHAR(10) NOT NULL,
    cohort_batch VARCHAR(20) NOT NULL,
    attendance NUMERIC(5, 2) DEFAULT 90.00,
    gpa NUMERIC(3, 2) DEFAULT 3.50,
    parent_name VARCHAR(150),
    parent_email VARCHAR(150),
    parent_phone VARCHAR(30),
    parent_relationship VARCHAR(50) DEFAULT 'Parent/Guardian',
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

-- 12. Parents Table (Linked to Student)
CREATE TABLE IF NOT EXISTS parents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    student_roll_no VARCHAR(30) NOT NULL,
    student_name VARCHAR(100),
    relationship VARCHAR(50) DEFAULT 'Parent/Guardian',
    alternate_phone VARCHAR(20),
    occupation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Central Questions Table (Public Q&A)
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- Academics, Examinations, Fees, Placement, Campus, Attendance, General
    author_id BIGINT,
    author_name VARCHAR(100) NOT NULL,
    author_role VARCHAR(30) NOT NULL, -- student, parent, faculty, admin
    author_email VARCHAR(120),
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, ANSWERED, RESOLVED
    upvotes INT DEFAULT 0,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Question Answers Table (Faculty / Official Answers)
CREATE TABLE IF NOT EXISTS question_answers (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE,
    responder_id BIGINT,
    responder_name VARCHAR(100) NOT NULL,
    responder_role VARCHAR(30) NOT NULL, -- faculty, hod, admin
    responder_title VARCHAR(100),
    content TEXT NOT NULL,
    is_official_answer BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Academic Calendars Table (Semester-wise)
CREATE TABLE IF NOT EXISTS academic_calendars (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester_type VARCHAR(20) NOT NULL, -- EVEN, ODD
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Calendar Events Table (Basis for Automatic Scheduled Notices)
CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGSERIAL PRIMARY KEY,
    calendar_id BIGINT REFERENCES academic_calendars(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- EXAM, ASSIGNMENT, PROJECT_REVIEW, HOLIDAY, WORKSHOP, FEST, RESULT, REGISTRATION, GENERAL
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    target_audience VARCHAR(50) DEFAULT 'ALL', -- ALL, STUDENT, PARENT, FACULTY
    location VARCHAR(150),
    is_notice_planned BOOLEAN DEFAULT TRUE,
    days_before_notice INT DEFAULT 7,
    notice_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, GENERATED, DISABLED
    generated_notice_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Active Academic Calendar
INSERT INTO academic_calendars (id, title, academic_year, semester_type, start_date, end_date, is_active)
VALUES (1, 'Even Semester Academic Calendar 2025-26', '2025-2026', 'EVEN', '2026-02-01', '2026-06-30', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Calendar Events with Notice Plans
INSERT INTO calendar_events (calendar_id, title, event_type, start_date, end_date, description, target_audience, location, is_notice_planned, days_before_notice, notice_status)
VALUES 
(1, 'Continuous Internal Evaluation (CIE - 1)', 'EXAM', '2026-03-10', '2026-03-14', 'First internal assessment examination for B.Tech CSE 2nd, 3rd, and 4th year students across all divisions.', 'ALL', 'Department Examination Halls', TRUE, 7, 'PENDING'),
(1, 'Mid-Semester Project Review (8th Sem Capstone)', 'PROJECT_REVIEW', '2026-03-25', '2026-03-27', 'Evaluation of Project Phase 2 for Final Year CSE students by Department Project Review Committee.', 'STUDENT', 'CSE Project Labs', TRUE, 5, 'PENDING'),
(1, 'Continuous Internal Evaluation (CIE - 2)', 'EXAM', '2026-04-20', '2026-04-24', 'Second internal assessment examination covering Units 3 & 4.', 'ALL', 'Department Examination Halls', TRUE, 7, 'PENDING'),
(1, 'Annual Technical Symposium & Hackathon - INVENTO 2026', 'FEST', '2026-05-02', '2026-05-03', 'Flagship national-level technical fest and 24-hour coding hackathon organized by CSE Department.', 'ALL', 'Main Auditorium & CSE Lab 1-4', TRUE, 10, 'PENDING'),
(1, 'Semester End Practical & Viva Examinations', 'EXAM', '2026-06-01', '2026-06-10', 'VTU Semester End Practical Examinations and Project Viva-Voce.', 'ALL', 'CSE Specialized Laboratories', TRUE, 7, 'PENDING')
ON CONFLICT DO NOTHING;

-- 17. Placement Stats Table
CREATE TABLE IF NOT EXISTS placement_stats (
    id BIGSERIAL PRIMARY KEY,
    highest_package VARCHAR(50),
    average_package VARCHAR(50),
    placement_ratio VARCHAR(50),
    total_offers VARCHAR(50),
    batch_year VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Placement Recruiters Table
CREATE TABLE IF NOT EXISTS placement_recruiters (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    package_band VARCHAR(100),
    role_tag VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Placement Drives Table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
