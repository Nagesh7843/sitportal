-- PostgreSQL Schema for sitportaldb (Communication Portal)

-- 1. Departments Table (All 8 SITCOE Engineering Departments)
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Seed all 8 SITCOE Departments
INSERT INTO departments (code, name, status) 
VALUES 
('CSE', 'Computer Science & Engineering', 'ACTIVE'),
('AIDS', 'Artificial Intelligence & Data Science', 'ACTIVE'),
('MECH', 'Mechanical Engineering', 'ACTIVE'),
('CIVIL', 'Civil Engineering', 'ACTIVE'),
('ENTC', 'Electronics & Telecommunication Engineering', 'ACTIVE'),
('ELECTRICAL', 'Electrical Engineering', 'ACTIVE'),
('MECHATRONICS', 'Mechatronics Engineering', 'ACTIVE'),
('BASIC_SCIENCES', 'Basic Sciences & Humanities', 'ACTIVE')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 1b. Programs Table
CREATE TABLE IF NOT EXISTS programs (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    degree VARCHAR(50) DEFAULT 'B.Tech'
);

INSERT INTO programs (department_id, code, name, degree)
VALUES
(1, 'BTECH_CSE', 'B.Tech in Computer Science & Engineering', 'B.Tech'),
(2, 'BTECH_AIDS', 'B.Tech in Artificial Intelligence & Data Science', 'B.Tech'),
(3, 'BTECH_MECH', 'B.Tech in Mechanical Engineering', 'B.Tech'),
(4, 'BTECH_CIVIL', 'B.Tech in Civil Engineering', 'B.Tech'),
(5, 'BTECH_ENTC', 'B.Tech in Electronics & Telecommunication Engineering', 'B.Tech'),
(6, 'BTECH_ELEC', 'B.Tech in Electrical Engineering', 'B.Tech'),
(7, 'BTECH_MTRX', 'B.Tech in Mechatronics Engineering', 'B.Tech'),
(8, 'FE_GENERAL', 'First Year Basic Sciences & Humanities Core', 'B.Tech')
ON CONFLICT (code) DO NOTHING;

-- 1c. Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
    id BIGSERIAL PRIMARY KEY,
    year_name VARCHAR(50) UNIQUE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE
);

INSERT INTO academic_years (year_name, is_current)
VALUES 
('2024-2025', FALSE),
('2025-2026', TRUE),
('2026-2027', FALSE)
ON CONFLICT (year_name) DO NOTHING;

-- 1d. Semesters Table
CREATE TABLE IF NOT EXISTS semesters (
    id BIGSERIAL PRIMARY KEY,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_number INT NOT NULL,
    semester_type VARCHAR(20) NOT NULL, -- ODD / EVEN
    is_active BOOLEAN DEFAULT FALSE
);

-- 1e. Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    year_level VARCHAR(20) NOT NULL, -- FE, SE, TE, BE
    name VARCHAR(20) NOT NULL
);

-- Seed Divisions for CSE Department (id: 1)
INSERT INTO divisions (department_id, academic_year_id, year_level, name)
VALUES
(1, 2, 'SE', 'Div A'),
(1, 2, 'SE', 'Div B'),
(1, 2, 'TE', 'Div A'),
(1, 2, 'TE', 'Div B'),
(1, 2, 'BE', 'Div A'),
(1, 2, 'BE', 'Div B')
ON CONFLICT DO NOTHING;

-- 1f. Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id BIGSERIAL PRIMARY KEY,
    division_id BIGINT REFERENCES divisions(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL
);

-- Seed Batches for Division 1 & 2
INSERT INTO batches (division_id, name)
VALUES
(1, 'Batch A1'),
(1, 'Batch A2'),
(1, 'Batch A3'),
(2, 'Batch B1'),
(2, 'Batch B2'),
(2, 'Batch B3')
ON CONFLICT DO NOTHING;

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
    banner_image_url TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Placement Recruiters Table
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
    logo_url VARCHAR(500),
    banner_image_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Placed Students Achievements Table
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

-- 21. System Settings Table (Central Database-Backed Portal Configuration)
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

-- 22. Notice Reads Table (Persistent Notice Read/Seen Tracking)
CREATE TABLE IF NOT EXISTS notice_reads (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT NOT NULL,
    user_identifier VARCHAR(150) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. Student Enrollments Table (Historical Progression Preserved)
CREATE TABLE IF NOT EXISTS student_enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    academic_year_id BIGINT REFERENCES academic_years(id),
    department_id BIGINT REFERENCES departments(id),
    program_id BIGINT REFERENCES programs(id),
    year_level VARCHAR(20) NOT NULL, -- FE, SE, TE, BE
    semester_id BIGINT REFERENCES semesters(id),
    division_id BIGINT REFERENCES divisions(id),
    batch_id BIGINT REFERENCES batches(id),
    is_current BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'ENROLLED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 24. Student Academic Data Table (CGPA, 10th, 12th / Diploma for Placement Eligibility)
CREATE TABLE IF NOT EXISTS student_academic_data (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) UNIQUE NOT NULL,
    cgpa NUMERIC(4, 2) DEFAULT 0.00,
    tenth_percentage NUMERIC(5, 2) DEFAULT 0.00,
    twelfth_percentage NUMERIC(5, 2) DEFAULT 0.00,
    diploma_percentage NUMERIC(5, 2) DEFAULT 0.00,
    qualification_path VARCHAR(20) DEFAULT '12TH', -- '12TH' or 'DIPLOMA'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. Student Change Requests Table (Self-Service Verification Workflow)
CREATE TABLE IF NOT EXISTS student_change_requests (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    verified_by_user_id BIGINT REFERENCES users(id),
    verified_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. Faculty Batch Assignments Table (Faculty -> Batch -> Students)
CREATE TABLE IF NOT EXISTS faculty_batch_assignments (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT REFERENCES faculty(id) ON DELETE CASCADE,
    batch_id BIGINT REFERENCES batches(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_faculty_batch UNIQUE(faculty_id, batch_id)
);

-- 27. Parent-Student Relationships Table (Security Boundary for Parent Data Access)
CREATE TABLE IF NOT EXISTS parent_student_relationships (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES parents(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'Parent/Guardian',
    status VARCHAR(20) DEFAULT 'VERIFIED', -- VERIFIED, PENDING, REJECTED
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_parent_student UNIQUE(parent_id, student_id)
);

-- 28. Notification Targets Table (Targeting by College, Dept, Program, Year, Division, Batch, Individual)
CREATE TABLE IF NOT EXISTS notification_targets (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    scope_type VARCHAR(50) NOT NULL, -- COLLEGE, DEPARTMENT, PROGRAM, YEAR, SEMESTER, DIVISION, BATCH, INDIVIDUAL
    scope_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 29. Notification Recipients Table (Recipient Fan-Out & Read/Delivery State)
CREATE TABLE IF NOT EXISTS notification_recipients (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(150),
    delivery_status VARCHAR(30) DEFAULT 'DELIVERED', -- PENDING, DELIVERED, FAILED
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notification_recipient UNIQUE(notification_id, user_id)
);

-- 30. Placement Eligibility Rules Table
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

-- 31. Placement Eligibility Results Table (Precomputed Student Eligibility Evaluation)
CREATE TABLE IF NOT EXISTS placement_eligibility_results (
    id BIGSERIAL PRIMARY KEY,
    placement_drive_id BIGINT REFERENCES placement_drives(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    prn VARCHAR(50) NOT NULL,
    is_eligible BOOLEAN NOT NULL,
    evaluation_reason TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_drive_student_eval UNIQUE(placement_drive_id, student_id)
);

-- 32. System Audit Logs Table (Accountability & Change Traceability)
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

-- 33. Device Notice Deliveries Table (Per-Device Duplicate Prevention & Exactly-Once Delivery)
CREATE TABLE IF NOT EXISTS device_notice_deliveries (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT REFERENCES notices(id) ON DELETE CASCADE,
    device_endpoint VARCHAR(1000) NOT NULL,
    user_email VARCHAR(150),
    device_type VARCHAR(100) DEFAULT 'Web Browser',
    delivery_status VARCHAR(30) DEFAULT 'DELIVERED', -- DELIVERED, SKIPPED_DUPLICATE, FAILED
    idempotency_key VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notice_device_delivery UNIQUE(notice_id, device_endpoint)
);

-- Production Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_notices_status_pub ON notices(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_prn ON students(prn);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ts ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON questions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notice_reads_notice_user ON notice_reads(notice_id, user_identifier);
CREATE INDEX IF NOT EXISTS idx_placed_achievers_batch ON placed_students_achievements(batch_year, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_placement_drives_date ON placement_drives(drive_date);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_prn ON student_enrollments(prn, is_current);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_batch ON student_enrollments(batch_id, is_current);
CREATE INDEX IF NOT EXISTS idx_student_academic_prn ON student_academic_data(prn);
CREATE INDEX IF NOT EXISTS idx_faculty_batch_fac ON faculty_batch_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_notification_recip_user ON notification_recipients(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_placement_eval_drive ON placement_eligibility_results(placement_drive_id, is_eligible);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON system_audit_logs(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_deliveries_notice ON device_notice_deliveries(notice_id);
CREATE INDEX IF NOT EXISTS idx_device_deliveries_endpoint ON device_notice_deliveries(device_endpoint);
CREATE INDEX IF NOT EXISTS idx_device_deliveries_email ON device_notice_deliveries(user_email);
