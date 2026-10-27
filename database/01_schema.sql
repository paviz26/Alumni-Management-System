-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- CORE POSTGRESQL DATABASE SCHEMA
-- ============================================================


-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20) UNIQUE
);


-- ============================================================
-- 2. USERS
-- Handles authentication and system roles
-- ============================================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ALUMNI',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_role
        CHECK (role IN ('ADMIN', 'ALUMNI', 'STUDENT','FACULTY'))
);

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(department_id) ON DELETE SET NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculty (
    faculty_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(department_id) ON DELETE SET NULL,
    designation VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. COMPANIES
-- ============================================================

CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL UNIQUE,
    industry VARCHAR(100),
    location VARCHAR(100),
    website_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. ALUMNI
-- ============================================================

CREATE TABLE alumni (
    alumni_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department_id INT,
    company_id INT,
    current_company VARCHAR(150),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    graduation_year INT,
    designation VARCHAR(100),
    location VARCHAR(100),
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- One alumni profile belongs to one user
    CONSTRAINT fk_alumni_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    -- Alumni belongs to a department
    CONSTRAINT fk_alumni_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON DELETE SET NULL,

    -- Current company of alumni
    CONSTRAINT fk_alumni_company
        FOREIGN KEY (company_id)
        REFERENCES companies(company_id)
        ON DELETE SET NULL,

    -- Basic validation
    CONSTRAINT chk_graduation_year
        CHECK (graduation_year BETWEEN 1950 AND 2100)
);


-- ============================================================
-- 5. EVENTS
-- ============================================================

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    venue VARCHAR(200),
    capacity INT,
    type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'CANCELLED')),
    created_by INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_event_capacity
        CHECK (capacity IS NULL OR capacity > 0)
);


-- ============================================================
-- 6. EVENT REGISTRATIONS
-- Many-to-many relationship:
-- Alumni <-> Events
-- ============================================================

CREATE TABLE event_registrations (
    registration_id SERIAL PRIMARY KEY,

    event_id INT NOT NULL,

    alumni_id INT NOT NULL,

    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    attendance_status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',


    CONSTRAINT fk_registration_event
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,


    CONSTRAINT fk_registration_alumni
        FOREIGN KEY (alumni_id)
        REFERENCES alumni(alumni_id)
        ON DELETE CASCADE,


    -- Prevent same alumni registering twice
    CONSTRAINT uq_event_alumni
        UNIQUE (event_id, alumni_id),


    CONSTRAINT chk_attendance_status
        CHECK (
            attendance_status IN
            ('REGISTERED', 'ATTENDED', 'CANCELLED')
        )
);


-- ============================================================
-- 7. JOBS
-- ============================================================

CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(company_id) ON DELETE SET NULL,
    posted_by INT,
    company VARCHAR(200),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    employment_type VARCHAR(30),
    application_url TEXT,
    deadline DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_poster
        FOREIGN KEY (posted_by)
        REFERENCES alumni(alumni_id)
        ON DELETE SET NULL
);


-- ============================================================
-- 8. JOB APPLICATIONS
-- Students may apply once to each job.
-- ============================================================
CREATE TABLE job_applications (
    application_id SERIAL PRIMARY KEY,
    job_id INT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    applied_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    CONSTRAINT uq_job_applications_job_student UNIQUE (job_id, student_id)
);


-- ============================================================
-- 9. MENTORSHIP
-- Students request mentorship from alumni.
-- ============================================================

CREATE TABLE mentorship (
    mentorship_id SERIAL PRIMARY KEY,

    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    alumni_id INT NOT NULL REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    area_of_interest VARCHAR(100),
    message TEXT,
    requested_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',


    CONSTRAINT chk_mentorship_status
        CHECK (
            status IN
            ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')
        ),


    CONSTRAINT uq_mentorship_student_alumni
        UNIQUE (student_id, alumni_id)
);


-- ============================================================
-- 10. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE announcements (
    announcement_id SERIAL PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    content TEXT NOT NULL,

    created_by INT,

    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED'
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),


    CONSTRAINT fk_announcement_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE connections (
    connection_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    requested_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_on TIMESTAMP,
    CONSTRAINT uq_connections_direction UNIQUE (sender_id, receiver_id),
    CONSTRAINT ck_connections_not_self CHECK (sender_id <> receiver_id)
);

CREATE TABLE achievements (
    achievement_id SERIAL PRIMARY KEY,
    alumni_id INT NOT NULL REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    achievement_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_invites (
    invite_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    invited_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    invited_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_invites_event_user UNIQUE (event_id, user_id)
);


-- ============================================================
-- 11. DONATIONS
-- ============================================================

CREATE TABLE donations (
    donation_id SERIAL PRIMARY KEY,

    alumni_id INT,

    amount NUMERIC(12,2) NOT NULL,

    donation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    purpose VARCHAR(200),

    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',


    CONSTRAINT fk_donation_alumni
        FOREIGN KEY (alumni_id)
        REFERENCES alumni(alumni_id)
        ON DELETE SET NULL,


    CONSTRAINT chk_donation_amount
        CHECK (amount > 0),


    CONSTRAINT chk_payment_status
        CHECK (
            payment_status IN
            ('PENDING', 'COMPLETED', 'FAILED')
        )
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_alumni_graduation_year
    ON alumni(graduation_year);

CREATE INDEX idx_alumni_department
    ON alumni(department_id);

CREATE INDEX idx_alumni_company
    ON alumni(company_id);

CREATE INDEX idx_events_date
    ON events(event_date);

CREATE INDEX idx_jobs_deadline
    ON jobs(deadline);
CREATE INDEX idx_jobs_company
    ON jobs(company);
CREATE INDEX idx_jobs_company_id
    ON jobs(company_id);

CREATE INDEX idx_event_registrations_alumni
    ON event_registrations(alumni_id);

CREATE INDEX idx_mentorship_mentor
    ON mentorship(alumni_id);

CREATE INDEX idx_mentorship_mentee
    ON mentorship(student_id);
