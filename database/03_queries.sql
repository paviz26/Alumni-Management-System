-- 1. Display all alumni
SELECT * FROM alumni;

-- 2. Alumni with department names
SELECT a.first_name, a.last_name, d.department_name, a.graduation_year
FROM alumni a
LEFT JOIN departments d ON a.department_id = d.department_id;

-- 3. Search alumni by company
SELECT first_name, last_name, current_company
FROM alumni
WHERE current_company ILIKE '%Tech%';

-- 4. Count alumni by department
SELECT d.department_name, COUNT(a.alumni_id) AS alumni_count
FROM departments d
LEFT JOIN alumni a ON d.department_id = a.department_id
GROUP BY d.department_id, d.department_name
ORDER BY alumni_count DESC;

-- 5. Count alumni by graduation year
SELECT graduation_year, COUNT(*) AS total_alumni
FROM alumni
GROUP BY graduation_year
ORDER BY graduation_year;

-- 6. Upcoming events
SELECT *
FROM events
WHERE event_date >= CURRENT_TIMESTAMP
ORDER BY event_date;

-- 7. Event registration details
SELECT e.title, a.first_name, a.last_name, er.attendance_status
FROM event_registrations er
JOIN events e ON er.event_id = e.event_id
JOIN alumni a ON er.alumni_id = a.alumni_id;

-- 8. Available jobs
SELECT j.title, c.company_name, j.location, j.deadline
FROM jobs j
LEFT JOIN companies c ON j.company_id = c.company_id
WHERE j.deadline IS NULL OR j.deadline >= CURRENT_DATE;

-- 9. Job application count
SELECT j.title, COUNT(ja.application_id) AS applications
FROM jobs j
LEFT JOIN job_applications ja ON j.job_id = ja.job_id
GROUP BY j.job_id, j.title;

-- 10. Accepted mentorships
SELECT m.mentorship_id,
       mentor.first_name AS mentor_first_name,
       mentee.first_name AS mentee_first_name
FROM mentorship m
JOIN alumni mentor ON m.mentor_id = mentor.alumni_id
JOIN alumni mentee ON m.mentee_id = mentee.alumni_id
WHERE m.status = 'ACCEPTED';

-- 11. Total completed donations
SELECT COALESCE(SUM(amount), 0) AS total_donations
FROM donations
WHERE payment_status = 'COMPLETED';

-- 12. Average donation
SELECT AVG(amount) AS average_donation
FROM donations
WHERE payment_status = 'COMPLETED';

-- 13. Alumni who have registered for events
SELECT DISTINCT a.first_name, a.last_name
FROM alumni a
JOIN event_registrations er ON a.alumni_id = er.alumni_id;

-- 14. Alumni who have not registered for any event
SELECT a.first_name, a.last_name
FROM alumni a
WHERE NOT EXISTS (
    SELECT 1
    FROM event_registrations er
    WHERE er.alumni_id = a.alumni_id
);
