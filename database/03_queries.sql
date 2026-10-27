-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- SQL QUERIES
-- ============================================================


-- ============================================================
-- 1. DISPLAY ALL ALUMNI
-- ============================================================

SELECT *
FROM alumni;


-- ============================================================
-- 2. ALUMNI WITH DEPARTMENT DETAILS
-- Demonstrates: LEFT JOIN
-- ============================================================

SELECT
    a.first_name,
    a.last_name,
    d.department_name,
    d.department_code,
    a.graduation_year
FROM alumni a
LEFT JOIN departments d
    ON a.department_id = d.department_id
ORDER BY a.graduation_year DESC;


-- ============================================================
-- 3. ALUMNI WITH THEIR COMPANY
-- Demonstrates: Multiple-table JOIN
-- ============================================================

SELECT
    a.first_name,
    a.last_name,
    c.company_name,
    c.industry,
    a.designation
FROM alumni a
LEFT JOIN companies c
    ON a.company_id = c.company_id
ORDER BY a.first_name;


-- ============================================================
-- 4. SEARCH ALUMNI BY COMPANY
-- Demonstrates: ILIKE
-- ============================================================

SELECT
    a.first_name,
    a.last_name,
    c.company_name,
    a.designation
FROM alumni a
JOIN companies c
    ON a.company_id = c.company_id
WHERE c.company_name ILIKE '%Google%';


-- ============================================================
-- 5. COUNT ALUMNI BY DEPARTMENT
-- Demonstrates: GROUP BY + COUNT + LEFT JOIN
-- ============================================================

SELECT
    d.department_name,
    COUNT(a.alumni_id) AS alumni_count
FROM departments d
LEFT JOIN alumni a
    ON d.department_id = a.department_id
GROUP BY
    d.department_id,
    d.department_name
ORDER BY alumni_count DESC;


-- ============================================================
-- 6. COUNT ALUMNI BY GRADUATION YEAR
-- Demonstrates: GROUP BY + COUNT
-- ============================================================

SELECT
    graduation_year,
    COUNT(*) AS total_alumni
FROM alumni
GROUP BY graduation_year
ORDER BY graduation_year;


-- ============================================================
-- 7. UPCOMING EVENTS
-- Demonstrates: Date filtering
-- ============================================================

SELECT
    event_id,
    title,
    event_date,
    venue,
    capacity
FROM events
WHERE event_date >= CURRENT_TIMESTAMP
ORDER BY event_date;


-- ============================================================
-- 8. EVENT REGISTRATION DETAILS
-- Demonstrates: Multiple INNER JOINs
-- ============================================================

SELECT
    e.title,
    e.event_date,
    a.first_name,
    a.last_name,
    er.attendance_status,
    er.registered_at
FROM event_registrations er
JOIN events e
    ON er.event_id = e.event_id
JOIN alumni a
    ON er.alumni_id = a.alumni_id
ORDER BY e.event_date;


-- ============================================================
-- 9. EVENT-WISE REGISTRATION COUNT
-- Demonstrates: GROUP BY + COUNT
-- ============================================================

SELECT
    e.title,
    e.capacity,
    COUNT(er.registration_id) AS registered_alumni
FROM events e
LEFT JOIN event_registrations er
    ON e.event_id = er.event_id
GROUP BY
    e.event_id,
    e.title,
    e.capacity
ORDER BY registered_alumni DESC;


-- ============================================================
-- 10. AVAILABLE JOB OPPORTUNITIES
-- Demonstrates: JOIN + NULL handling
-- ============================================================

SELECT
    j.title,
    COALESCE(j.company, c.company_name) AS company_name,
    j.location,
    j.employment_type,
    j.deadline,
    j.application_url
FROM jobs j
LEFT JOIN companies c
    ON j.company_id = c.company_id
WHERE j.deadline IS NULL
   OR j.deadline >= CURRENT_DATE
ORDER BY j.deadline;


-- ============================================================
-- 11. JOBS POSTED BY ALUMNI
-- Demonstrates: JOIN through foreign key
-- ============================================================

SELECT
    j.title AS job_title,
    COALESCE(j.company, c.company_name) AS company_name,
    a.first_name || ' ' || a.last_name AS posted_by,
    j.location,
    j.employment_type
FROM jobs j
LEFT JOIN companies c
    ON j.company_id = c.company_id
LEFT JOIN alumni a
    ON j.posted_by = a.alumni_id
ORDER BY j.created_at DESC;


-- ============================================================
-- 12. ACCEPTED MENTORSHIPS
-- Demonstrates: Student-to-alumni relationship
-- ============================================================

SELECT
    m.mentorship_id,
    mentor.first_name || ' ' || mentor.last_name AS mentor,
    mentee_user.first_name || ' ' || mentee_user.last_name AS mentee,
    m.status,
    m.requested_on
FROM mentorship m
JOIN alumni mentor
    ON m.alumni_id = mentor.alumni_id
JOIN students mentee
    ON m.student_id = mentee.student_id
JOIN users mentee_user
    ON mentee.user_id = mentee_user.user_id
WHERE m.status = 'ACCEPTED';


-- ============================================================
-- 13. ALL MENTORSHIP REQUESTS
-- ============================================================

SELECT
    mentor.first_name || ' ' || mentor.last_name AS mentor,
    mentee_user.first_name || ' ' || mentee_user.last_name AS mentee,
    m.status,
    m.requested_on
FROM mentorship m
JOIN alumni mentor
    ON m.alumni_id = mentor.alumni_id
JOIN students mentee
    ON m.student_id = mentee.student_id
JOIN users mentee_user
    ON mentee.user_id = mentee_user.user_id
ORDER BY m.requested_on DESC;


-- ============================================================
-- 14. TOTAL COMPLETED DONATIONS
-- Demonstrates: SUM + COALESCE
-- ============================================================

SELECT
    COALESCE(SUM(amount), 0) AS total_donations
FROM donations
WHERE payment_status = 'COMPLETED';


-- ============================================================
-- 15. AVERAGE COMPLETED DONATION
-- Demonstrates: AVG
-- ============================================================

SELECT
    ROUND(AVG(amount), 2) AS average_donation
FROM donations
WHERE payment_status = 'COMPLETED';


-- ============================================================
-- 16. DONATIONS BY ALUMNI
-- Demonstrates: JOIN + SUM + GROUP BY
-- ============================================================

SELECT
    a.first_name || ' ' || a.last_name AS alumni_name,
    COALESCE(SUM(d.amount), 0) AS total_donated
FROM alumni a
LEFT JOIN donations d
    ON a.alumni_id = d.alumni_id
   AND d.payment_status = 'COMPLETED'
GROUP BY
    a.alumni_id,
    a.first_name,
    a.last_name
ORDER BY total_donated DESC;


-- ============================================================
-- 17. ALUMNI WHO HAVE REGISTERED FOR EVENTS
-- Demonstrates: DISTINCT
-- ============================================================

SELECT DISTINCT
    a.first_name,
    a.last_name
FROM alumni a
JOIN event_registrations er
    ON a.alumni_id = er.alumni_id
ORDER BY a.first_name;


-- ============================================================
-- 18. ALUMNI WHO HAVE NOT REGISTERED FOR ANY EVENT
-- Demonstrates: NOT EXISTS / Subquery
-- ============================================================

SELECT
    a.first_name,
    a.last_name
FROM alumni a
WHERE NOT EXISTS (
    SELECT 1
    FROM event_registrations er
    WHERE er.alumni_id = a.alumni_id
);


-- ============================================================
-- 19. ALUMNI WITH ABOVE-AVERAGE DONATIONS
-- Demonstrates: Subquery
-- ============================================================

SELECT
    a.first_name,
    a.last_name,
    d.amount
FROM alumni a
JOIN donations d
    ON a.alumni_id = d.alumni_id
WHERE d.amount > (
    SELECT AVG(amount)
    FROM donations
    WHERE payment_status = 'COMPLETED'
)
AND d.payment_status = 'COMPLETED'
ORDER BY d.amount DESC;


-- ============================================================
-- 20. DEPARTMENTS HAVING MORE THAN ONE ALUMNI
-- Demonstrates: HAVING
-- ============================================================

SELECT
    d.department_name,
    COUNT(a.alumni_id) AS alumni_count
FROM departments d
JOIN alumni a
    ON d.department_id = a.department_id
GROUP BY
    d.department_id,
    d.department_name
HAVING COUNT(a.alumni_id) > 1
ORDER BY alumni_count DESC;


-- ============================================================
-- 21. ALUMNI WITH JOB OPPORTUNITIES IN THEIR CITY
-- Demonstrates: JOIN + comparison
-- ============================================================

SELECT
    a.first_name,
    a.last_name,
    a.location AS alumni_location,
    j.title AS job_title,
    j.location AS job_location
FROM alumni a
JOIN jobs j
    ON LOWER(a.location) = LOWER(j.location)
ORDER BY a.first_name;


-- ============================================================
-- 22. EVENT REGISTRATION STATUS SUMMARY
-- Demonstrates: GROUP BY + conditional filtering
-- ============================================================

SELECT
    attendance_status,
    COUNT(*) AS total_registrations
FROM event_registrations
GROUP BY attendance_status
ORDER BY total_registrations DESC;


-- ============================================================
-- 23. ALUMNI BY COMPANY
-- Demonstrates: GROUP BY + HAVING
-- ============================================================

SELECT
    c.company_name,
    COUNT(a.alumni_id) AS alumni_count
FROM companies c
LEFT JOIN alumni a
    ON c.company_id = a.company_id
GROUP BY
    c.company_id,
    c.company_name
HAVING COUNT(a.alumni_id) > 0
ORDER BY alumni_count DESC;


-- ============================================================
-- 24. ALUMNI PROFILE WITH COMPLETE DETAILS
-- Demonstrates: Multiple JOINs
-- ============================================================

SELECT
    a.first_name || ' ' || a.last_name AS alumni_name,
    d.department_name,
    c.company_name,
    a.designation,
    a.graduation_year,
    a.location
FROM alumni a
LEFT JOIN departments d
    ON a.department_id = d.department_id
LEFT JOIN companies c
    ON a.company_id = c.company_id
ORDER BY a.graduation_year DESC;
