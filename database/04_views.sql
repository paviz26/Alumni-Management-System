-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- DATABASE VIEWS
-- ============================================================


-- ============================================================
-- 1. ALUMNI DIRECTORY
-- Combines alumni, department and company information
-- ============================================================

CREATE OR REPLACE VIEW alumni_directory AS
SELECT
    a.alumni_id,
    a.first_name,
    a.last_name,
    a.graduation_year,
    d.department_name,
    d.department_code,
    c.company_name,
    c.industry,
    a.designation,
    a.location,
    a.linkedin_url,
    a.github_url
FROM alumni a
LEFT JOIN departments d
    ON a.department_id = d.department_id
LEFT JOIN companies c
    ON a.company_id = c.company_id;


-- ============================================================
-- 2. EVENT PARTICIPATION
-- Shows registration count for each event
-- ============================================================

CREATE OR REPLACE VIEW event_participation AS
SELECT
    e.event_id,
    e.title,
    e.event_date,
    e.venue,
    e.capacity,
    COUNT(er.registration_id) AS registrations
FROM events e
LEFT JOIN event_registrations er
    ON e.event_id = er.event_id
GROUP BY
    e.event_id,
    e.title,
    e.event_date,
    e.venue,
    e.capacity;


-- ============================================================
-- 3. ALUMNI CAREER DIRECTORY
-- Shows alumni and their current company/designation
-- ============================================================

CREATE OR REPLACE VIEW alumni_career AS
SELECT
    a.alumni_id,
    a.first_name || ' ' || a.last_name AS alumni_name,
    a.graduation_year,
    d.department_name,
    c.company_name,
    c.industry,
    a.designation,
    a.location
FROM alumni a
LEFT JOIN departments d
    ON a.department_id = d.department_id
LEFT JOIN companies c
    ON a.company_id = c.company_id;


-- ============================================================
-- 4. JOB OPPORTUNITIES
-- Shows jobs together with company and alumni poster
-- ============================================================

CREATE OR REPLACE VIEW job_opportunities AS
SELECT
    j.job_id,
    j.title AS job_title,
    COALESCE(j.company, c.company_name) AS company_name,
    NULL::VARCHAR AS industry,
    j.location,
    j.employment_type,
    j.deadline,
    j.application_url,
    a.first_name || ' ' || a.last_name AS posted_by
FROM jobs j
LEFT JOIN companies c
    ON j.company_id = c.company_id
LEFT JOIN alumni a
    ON j.posted_by = a.alumni_id;


-- ============================================================
-- 5. MENTORSHIP DIRECTORY
-- Shows mentor and mentee names
-- ============================================================

CREATE OR REPLACE VIEW mentorship_directory AS
SELECT
    m.mentorship_id,
    COALESCE(mentor.first_name, mentor_user.first_name) || ' ' || COALESCE(mentor.last_name, mentor_user.last_name, '') AS mentor,
    mentee_user.first_name || ' ' || mentee_user.last_name AS mentee,
    m.status,
    m.requested_on
FROM mentorship m
JOIN alumni mentor
    ON m.alumni_id = mentor.alumni_id
JOIN users mentor_user
    ON mentor.user_id = mentor_user.user_id
JOIN students mentee
    ON m.student_id = mentee.student_id
JOIN users mentee_user
    ON mentee.user_id = mentee_user.user_id;


-- ============================================================
-- 6. DONATION SUMMARY
-- Shows completed donations made by each alumni
-- ============================================================

CREATE OR REPLACE VIEW donation_summary AS
SELECT
    a.alumni_id,
    a.first_name || ' ' || a.last_name AS alumni_name,
    COUNT(d.donation_id) AS donation_count,
    COALESCE(SUM(
        CASE
            WHEN d.payment_status = 'COMPLETED'
            THEN d.amount
            ELSE 0
        END
    ), 0) AS total_donated
FROM alumni a
LEFT JOIN donations d
    ON a.alumni_id = d.alumni_id
GROUP BY
    a.alumni_id,
    a.first_name,
    a.last_name;


-- ============================================================
-- 7. ALUMNI EVENT REGISTRATION DETAILS
-- Detailed view of alumni event participation
-- ============================================================

CREATE OR REPLACE VIEW alumni_event_history AS
SELECT
    er.registration_id,
    a.alumni_id,
    a.first_name || ' ' || a.last_name AS alumni_name,
    e.event_id,
    e.title AS event_title,
    e.event_date,
    er.attendance_status,
    er.registered_at
FROM event_registrations er
JOIN alumni a
    ON er.alumni_id = a.alumni_id
JOIN events e
    ON er.event_id = e.event_id;


-- ============================================================
-- 8. DEPARTMENT ALUMNI SUMMARY
-- Shows alumni count for every department
-- ============================================================

CREATE OR REPLACE VIEW department_alumni_summary AS
SELECT
    d.department_id,
    d.department_name,
    d.department_code,
    COUNT(a.alumni_id) AS alumni_count
FROM departments d
LEFT JOIN alumni a
    ON d.department_id = a.department_id
GROUP BY
    d.department_id,
    d.department_name,
    d.department_code;
