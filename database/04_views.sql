CREATE OR REPLACE VIEW alumni_directory AS
SELECT
    a.alumni_id,
    a.first_name,
    a.last_name,
    a.graduation_year,
    d.department_name,
    a.current_company,
    a.designation,
    a.location
FROM alumni a
LEFT JOIN departments d ON a.department_id = d.department_id;

CREATE OR REPLACE VIEW event_participation AS
SELECT
    e.event_id,
    e.title,
    e.event_date,
    COUNT(er.registration_id) AS registrations
FROM events e
LEFT JOIN event_registrations er ON e.event_id = er.event_id
GROUP BY e.event_id, e.title, e.event_date;
