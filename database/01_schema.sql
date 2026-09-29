-- ============================================
-- ALUMNI MANAGEMENT SYSTEM - POSTGRESQL SCHEMA
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20) UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ALUMNI',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'ALUMNI', 'STUDENT'))
);

CREATE TABLE IF NOT EXISTS alumni (
    alumni_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    phone VARCHAR(20),
    graduation_year INT,
    department_id INT REFERENCES departments(department_id) ON DELETE SET NULL,
    current_company VARCHAR(150),
    designation VARCHAR(100),
    location VARCHAR(100),
    bio TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL UNIQUE,
    industry VARCHAR(100),
    location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    venue VARCHAR(200),
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
    registration_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    alumni_id INT NOT NULL REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(20) DEFAULT 'REGISTERED',
    UNIQUE(event_id, alumni_id),
    CONSTRAINT chk_attendance_status
        CHECK (attendance_status IN ('REGISTERED', 'ATTENDED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(company_id) ON DELETE SET NULL,
    posted_by INT REFERENCES alumni(alumni_id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    employment_type VARCHAR(30),
    application_url TEXT,
    deadline DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
    application_id SERIAL PRIMARY KEY,
    job_id INT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    alumni_id INT NOT NULL REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'APPLIED',
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, alumni_id)
);

CREATE TABLE IF NOT EXISTS mentorship (
    mentorship_id SERIAL PRIMARY KEY,
    mentor_id INT NOT NULL REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    mentee_id INT NOT NULL REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    CONSTRAINT chk_mentorship_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
    CONSTRAINT chk_different_users CHECK (mentor_id <> mentee_id)
);

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
    donation_id SERIAL PRIMARY KEY,
    alumni_id INT REFERENCES alumni(alumni_id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    donation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    purpose VARCHAR(200),
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    CONSTRAINT chk_payment_status
        CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_alumni_graduation_year
    ON alumni(graduation_year);

CREATE INDEX IF NOT EXISTS idx_alumni_department
    ON alumni(department_id);

CREATE INDEX IF NOT EXISTS idx_events_date
    ON events(event_date);

CREATE INDEX IF NOT EXISTS idx_jobs_deadline
    ON jobs(deadline);
