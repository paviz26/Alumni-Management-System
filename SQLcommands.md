# SQL commands for the DBMS viva

These commands connect to the same PostgreSQL database used by the frontend and backend. Run them in a terminal from the project folder. They only read data; use the tables to show records created or changed through the frontend.

## 1. Start PostgreSQL

If PostgreSQL is managed by this project's Docker Compose file, start it with:

```bash
docker compose up -d postgres
```

If PostgreSQL is already running locally, skip this step.

## 2. Connect with `psql`

The backend normally connects as `alumni_app`. Use that same role so you inspect the same database and permissions as the application:

```bash
psql -h localhost -p 5432 -U alumni_app -d alumni_management
```

Enter the `alumni_app` password when prompted. The connection settings are in `backend/.env` (`DATABASE_URL`); do not paste or share that file. If your database uses a different host, port, database name, or username, use those values from `DATABASE_URL` instead. If `psql` is not installed, install the PostgreSQL command-line client first.

When connected, the prompt looks similar to `alumni_management=>`. Commands beginning with `\` are `psql` commands; SQL statements end with a semicolon.

## 3. List tables and inspect their definitions

```sql
\conninfo
\dt
\dt public.*
\d users
\d alumni
\d students
\d faculty
```

Use `\d table_name` for any table to see its columns, types, and constraints. To list views too, run `\dv`.

## 4. Show the current table contents

Run these `SELECT` statements to display rows saved by the application. They read the current database contents every time you run them, so return to a table and query it again after adding or changing a record in the frontend.

```sql
SELECT * FROM departments ORDER BY department_id;
SELECT * FROM companies ORDER BY company_id;

-- Do not display password hashes during a viva.
SELECT user_id, email, role, first_name, last_name, created_at
FROM users ORDER BY user_id;

SELECT * FROM alumni ORDER BY alumni_id;
SELECT * FROM students ORDER BY student_id;
SELECT * FROM faculty ORDER BY faculty_id;
SELECT * FROM events ORDER BY event_id;
SELECT * FROM event_registrations ORDER BY registration_id;
SELECT * FROM jobs ORDER BY job_id;
SELECT * FROM job_applications ORDER BY application_id;
SELECT * FROM mentorship ORDER BY mentorship_id;
SELECT * FROM announcements ORDER BY announcement_id;
SELECT * FROM connections ORDER BY connection_id;
SELECT * FROM achievements ORDER BY achievement_id;
SELECT * FROM donations ORDER BY donation_id;
SELECT * FROM event_invites ORDER BY invite_id;
SELECT * FROM notifications ORDER BY notification_id;
```

If a table is empty, its query returns `0 rows`; create a corresponding record through the frontend and run that `SELECT` again. To inspect a single table at a time, use `SELECT * FROM table_name;`.

## 5. Useful joined views of related frontend data

These joins make it easier to show which account owns a profile, which alumni registered for an event, and which student applied for a job:

```sql
-- Accounts and alumni profiles
SELECT u.user_id, u.email, u.role, a.alumni_id,
       a.first_name, a.last_name, a.graduation_year,
       a.current_company, a.verification_status
FROM users AS u
JOIN alumni AS a ON a.user_id = u.user_id
ORDER BY a.alumni_id;

-- Accounts and student profiles
SELECT u.user_id, u.email, s.student_id, s.registration_number,
       d.department_name
FROM users AS u
JOIN students AS s ON s.user_id = u.user_id
LEFT JOIN departments AS d ON d.department_id = s.department_id
ORDER BY s.student_id;

-- Event registrations with event and alumni details
SELECT e.event_id, e.title, e.event_date,
       a.alumni_id, a.first_name, a.last_name,
       er.registered_at, er.attendance_status
FROM event_registrations AS er
JOIN events AS e ON e.event_id = er.event_id
JOIN alumni AS a ON a.alumni_id = er.alumni_id
ORDER BY er.registration_id;

-- Job applications with job and student details
SELECT j.job_id, j.title, j.company,
       s.student_id, s.registration_number,
       ja.applied_on, ja.status
FROM job_applications AS ja
JOIN jobs AS j ON j.job_id = ja.job_id
JOIN students AS s ON s.student_id = ja.student_id
ORDER BY ja.application_id;
```

## 6. Count rows in each application table

```sql
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'alumni', COUNT(*) FROM alumni
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL SELECT 'departments', COUNT(*) FROM departments
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'event_registrations', COUNT(*) FROM event_registrations
UNION ALL SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL SELECT 'job_applications', COUNT(*) FROM job_applications
UNION ALL SELECT 'mentorship', COUNT(*) FROM mentorship
UNION ALL SELECT 'announcements', COUNT(*) FROM announcements
UNION ALL SELECT 'connections', COUNT(*) FROM connections
UNION ALL SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL SELECT 'donations', COUNT(*) FROM donations
UNION ALL SELECT 'event_invites', COUNT(*) FROM event_invites
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;
```

## 7. Finish

```sql
\q
```

If `psql` reports `permission denied`, reconnect using the configured `alumni_app` role or ask the database administrator to grant it `SELECT` access. If it reports `relation does not exist`, check that you connected to `alumni_management` and that the project's Alembic migrations have been applied (`cd backend && alembic upgrade head`).
