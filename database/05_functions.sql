-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- DATABASE FUNCTIONS
-- ============================================================


-- ============================================================
-- 1. GET ALUMNI COUNT BY DEPARTMENT
-- ============================================================

CREATE OR REPLACE FUNCTION get_alumni_count_by_department(
    p_department_id INT
)
RETURNS INT
LANGUAGE SQL
AS $$
    SELECT COUNT(*)::INT
    FROM alumni
    WHERE department_id = p_department_id;
$$;


-- ============================================================
-- 2. GET TOTAL COMPLETED DONATIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_total_completed_donations()
RETURNS NUMERIC
LANGUAGE SQL
AS $$
    SELECT COALESCE(SUM(amount), 0)
    FROM donations
    WHERE payment_status = 'COMPLETED';
$$;


-- ============================================================
-- 3. GET EVENT REGISTRATION COUNT
-- ============================================================

CREATE OR REPLACE FUNCTION get_event_registration_count(
    p_event_id INT
)
RETURNS INT
LANGUAGE SQL
AS $$
    SELECT COUNT(*)::INT
    FROM event_registrations
    WHERE event_id = p_event_id;
$$;


-- ============================================================
-- 4. GET TOTAL DONATION BY ALUMNI
-- ============================================================

CREATE OR REPLACE FUNCTION get_alumni_donation_total(
    p_alumni_id INT
)
RETURNS NUMERIC
LANGUAGE SQL
AS $$
    SELECT COALESCE(SUM(amount), 0)
    FROM donations
    WHERE alumni_id = p_alumni_id
      AND payment_status = 'COMPLETED';
$$;


-- ============================================================
-- 5. GET ALUMNI FULL NAME
-- ============================================================

CREATE OR REPLACE FUNCTION get_alumni_name(
    p_alumni_id INT
)
RETURNS TEXT
LANGUAGE SQL
AS $$
    SELECT first_name || ' ' || COALESCE(last_name, '')
    FROM alumni
    WHERE alumni_id = p_alumni_id;
$$;


-- ============================================================
-- 6. GET NUMBER OF JOBS POSTED BY AN ALUMNI
-- ============================================================

CREATE OR REPLACE FUNCTION get_jobs_posted_by_alumni(
    p_alumni_id INT
)
RETURNS INT
LANGUAGE SQL
AS $$
    SELECT COUNT(*)::INT
    FROM jobs
    WHERE posted_by = p_alumni_id;
$$;