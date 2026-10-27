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
    department_code VARCHAR(20) NOT NULL UNIQUE
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_role
        CHECK (role IN ('ADMIN', 'ALUMNI', 'STUDENT','FACULTY'))
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
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    phone VARCHAR(20),
    graduation_year INT NOT NULL,
    designation VARCHAR(100),
    location VARCHAR(100),
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
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
    company_id INT,
    posted_by INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    employment_type VARCHAR(30),
    application_url TEXT,
    deadline DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_company
        FOREIGN KEY (company_id)
        REFERENCES companies(company_id)
        ON DELETE SET NULL,


    CONSTRAINT fk_job_poster
        FOREIGN KEY (posted_by)
        REFERENCES alumni(alumni_id)
        ON DELETE SET NULL
);


-- ============================================================
-- 8. JOB APPLICATIONS
-- Many-to-many relationship:
-- Alumni <-> Jobs
-- ============================================================




-- ============================================================
-- 9. MENTORSHIP
-- Alumni can mentor other alumni
-- ============================================================

CREATE TABLE mentorship (
    mentorship_id SERIAL PRIMARY KEY,

    mentor_id INT NOT NULL,

    mentee_id INT NOT NULL,

    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',


    CONSTRAINT fk_mentor
        FOREIGN KEY (mentor_id)
        REFERENCES alumni(alumni_id)
        ON DELETE CASCADE,


    CONSTRAINT fk_mentee
        FOREIGN KEY (mentee_id)
        REFERENCES alumni(alumni_id)
        ON DELETE CASCADE,


    CONSTRAINT chk_mentorship_status
        CHECK (
            status IN
            ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')
        ),


    -- Someone cannot mentor themselves
    CONSTRAINT chk_different_mentor_mentee
        CHECK (mentor_id <> mentee_id)
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


    CONSTRAINT fk_announcement_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
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
    ON jobs(company_id);


CREATE INDEX idx_event_registrations_alumni
    ON event_registrations(alumni_id);

CREATE INDEX idx_mentorship_mentor
    ON mentorship(mentor_id);

CREATE INDEX idx_mentorship_mentee
    ON mentorship(mentee_id);