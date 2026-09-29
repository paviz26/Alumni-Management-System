-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- SAMPLE DATA
-- ============================================================

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================

INSERT INTO departments (department_name, department_code)
VALUES
    ('Computer Science and Engineering', 'CSE'),
    ('Electronics and Communication Engineering', 'ECE'),
    ('Electrical and Electronics Engineering', 'EEE'),
    ('Mechanical Engineering', 'ME'),
    ('Artificial Intelligence and Data Science', 'AIDS');


-- ============================================================
-- 2. USERS
-- ============================================================

INSERT INTO users (email, password_hash, role)
VALUES
    ('admin@university.edu', 'hashed_admin_password', 'ADMIN'),
    ('rahul.sharma@example.com', 'hashed_password_1', 'ALUMNI'),
    ('priya.menon@example.com', 'hashed_password_2', 'ALUMNI'),
    ('arjun.nair@example.com', 'hashed_password_3', 'ALUMNI'),
    ('sneha.krishnan@example.com', 'hashed_password_4', 'ALUMNI'),
    ('vishal.reddy@example.com', 'hashed_password_5', 'ALUMNI'),
    ('student1@university.edu', 'hashed_student_password', 'STUDENT');


-- ============================================================
-- 3. COMPANIES
-- ============================================================

INSERT INTO companies (company_name, industry, location, website_url)
VALUES
    ('Google', 'Technology', 'Bangalore', 'https://www.google.com'),
    ('Microsoft', 'Technology', 'Hyderabad', 'https://www.microsoft.com'),
    ('Amazon', 'E-Commerce and Cloud', 'Bangalore', 'https://www.amazon.com'),
    ('Infosys', 'IT Services', 'Bangalore', 'https://www.infosys.com'),
    ('TCS', 'IT Services', 'Mumbai', 'https://www.tcs.com');


-- ============================================================
-- 4. ALUMNI
-- ============================================================

INSERT INTO alumni (
    user_id,
    department_id,
    company_id,
    first_name,
    last_name,
    phone,
    graduation_year,
    designation,
    location,
    bio,
    linkedin_url,
    github_url
)
VALUES
(
    (SELECT user_id FROM users WHERE email = 'rahul.sharma@example.com'),
    (SELECT department_id FROM departments WHERE department_code = 'CSE'),
    (SELECT company_id FROM companies WHERE company_name = 'Google'),
    'Rahul',
    'Sharma',
    '9876543210',
    2021,
    'Software Engineer',
    'Bangalore',
    'Software engineer working on distributed systems and cloud technologies.',
    'https://linkedin.com/in/rahul-sharma',
    'https://github.com/rahul-sharma'
),
(
    (SELECT user_id FROM users WHERE email = 'priya.menon@example.com'),
    (SELECT department_id FROM departments WHERE department_code = 'ECE'),
    (SELECT company_id FROM companies WHERE company_name = 'Microsoft'),
    'Priya',
    'Menon',
    '9876543211',
    2020,
    'Data Scientist',
    'Hyderabad',
    'Data scientist interested in machine learning and analytics.',
    'https://linkedin.com/in/priya-menon',
    'https://github.com/priya-menon'
),
(
    (SELECT user_id FROM users WHERE email = 'arjun.nair@example.com'),
    (SELECT department_id FROM departments WHERE department_code = 'CSE'),
    (SELECT company_id FROM companies WHERE company_name = 'Amazon'),
    'Arjun',
    'Nair',
    '9876543212',
    2022,
    'Cloud Engineer',
    'Bangalore',
    'Cloud engineer working with AWS and scalable infrastructure.',
    'https://linkedin.com/in/arjun-nair',
    'https://github.com/arjun-nair'
),
(
    (SELECT user_id FROM users WHERE email = 'sneha.krishnan@example.com'),
    (SELECT department_id FROM departments WHERE department_code = 'AIDS'),
    (SELECT company_id FROM companies WHERE company_name = 'Infosys'),
    'Sneha',
    'Krishnan',
    '9876543213',
    2019,
    'AI Engineer',
    'Bangalore',
    'AI engineer working on machine learning applications.',
    'https://linkedin.com/in/sneha-krishnan',
    'https://github.com/sneha-krishnan'
),
(
    (SELECT user_id FROM users WHERE email = 'vishal.reddy@example.com'),
    (SELECT department_id FROM departments WHERE department_code = 'EEE'),
    (SELECT company_id FROM companies WHERE company_name = 'TCS'),
    'Vishal',
    'Reddy',
    '9876543214',
    2018,
    'Project Manager',
    'Mumbai',
    'Technology project manager with experience in enterprise software.',
    'https://linkedin.com/in/vishal-reddy',
    'https://github.com/vishal-reddy'
);


-- ============================================================
-- 5. EVENTS
-- ============================================================

INSERT INTO events (
    title,
    description,
    event_date,
    venue,
    capacity,
    created_by
)
VALUES
(
    'Alumni Meet 2026',
    'Annual gathering of alumni and students.',
    '2026-11-15 10:00:00',
    'University Auditorium',
    200,
    (SELECT user_id FROM users WHERE email = 'admin@university.edu')
),
(
    'Career Networking Session',
    'Networking session between students and alumni professionals.',
    '2026-12-05 14:00:00',
    'Seminar Hall',
    100,
    (SELECT user_id FROM users WHERE email = 'admin@university.edu')
),
(
    'AI and Future Technologies',
    'Interactive session on artificial intelligence and emerging technologies.',
    '2027-01-20 11:00:00',
    'Innovation Lab',
    80,
    (SELECT user_id FROM users WHERE email = 'admin@university.edu')
);


-- ============================================================
-- 6. EVENT REGISTRATIONS
-- ============================================================

INSERT INTO event_registrations (
    event_id,
    alumni_id,
    attendance_status
)
VALUES
(
    (SELECT event_id FROM events WHERE title = 'Alumni Meet 2026'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Rahul'),
    'REGISTERED'
),
(
    (SELECT event_id FROM events WHERE title = 'Alumni Meet 2026'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Priya'),
    'ATTENDED'
),
(
    (SELECT event_id FROM events WHERE title = 'Career Networking Session'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Arjun'),
    'REGISTERED'
),
(
    (SELECT event_id FROM events WHERE title = 'AI and Future Technologies'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Sneha'),
    'REGISTERED'
);


-- ============================================================
-- 7. JOBS
-- ============================================================

INSERT INTO jobs (
    company_id,
    posted_by,
    title,
    description,
    location,
    employment_type,
    application_url,
    deadline
)
VALUES
(
    (SELECT company_id FROM companies WHERE company_name = 'Google'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Rahul'),
    'Software Engineer',
    'Software engineering opportunity for computer science graduates.',
    'Bangalore',
    'FULL_TIME',
    'https://careers.google.com/',
    '2026-12-31'
),
(
    (SELECT company_id FROM companies WHERE company_name = 'Microsoft'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Priya'),
    'Data Scientist',
    'Data science role involving machine learning and analytics.',
    'Hyderabad',
    'FULL_TIME',
    'https://careers.microsoft.com/',
    '2026-11-30'
),
(
    (SELECT company_id FROM companies WHERE company_name = 'Amazon'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Arjun'),
    'Cloud Engineer',
    'Cloud engineering role focused on scalable infrastructure.',
    'Bangalore',
    'FULL_TIME',
    'https://www.amazon.jobs/',
    '2026-12-15'
);


-- ============================================================
-- 8. MENTORSHIP
-- ============================================================

INSERT INTO mentorship (
    mentor_id,
    mentee_id,
    status
)
VALUES
(
    (SELECT alumni_id FROM alumni WHERE first_name = 'Rahul'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Arjun'),
    'ACCEPTED'
),
(
    (SELECT alumni_id FROM alumni WHERE first_name = 'Priya'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Sneha'),
    'PENDING'
),
(
    (SELECT alumni_id FROM alumni WHERE first_name = 'Vishal'),
    (SELECT alumni_id FROM alumni WHERE first_name = 'Arjun'),
    'COMPLETED'
);


-- ============================================================
-- 9. ANNOUNCEMENTS
-- ============================================================

INSERT INTO announcements (
    title,
    content,
    created_by
)
VALUES
(
    'Annual Alumni Meet Registration',
    'Registration is now open for the annual alumni meet.',
    (SELECT user_id FROM users WHERE email = 'admin@university.edu')
),
(
    'New Career Opportunities',
    'New job opportunities have been posted by alumni.',
    (SELECT user_id FROM users WHERE email = 'admin@university.edu')
),
(
    'Mentorship Program',
    'Alumni can now participate in the mentorship program.',
    (SELECT user_id FROM users WHERE email = 'admin@university.edu')
);


-- ============================================================
-- 10. DONATIONS
-- ============================================================

INSERT INTO donations (
    alumni_id,
    amount,
    purpose,
    payment_status
)
VALUES
(
    (SELECT alumni_id FROM alumni WHERE first_name = 'Rahul'),
    25000.00,
    'Student Scholarship Fund',
    'COMPLETED'
),
(
    (SELECT alumni_id FROM alumni WHERE first_name = 'Priya'),
    15000.00,
    'Alumni Event',
    'COMPLETED'
),
(
    (SELECT alumni_id FROM alumni WHERE first_name = 'Arjun'),
    10000.00,
    'Infrastructure Development',
    'PENDING'
),
(
    (SELECT alumni_id FROM alumni WHERE first_name = 'Sneha'),
    20000.00,
    'Student Scholarship Fund',
    'COMPLETED'
);