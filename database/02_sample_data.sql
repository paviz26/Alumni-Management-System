INSERT INTO departments (department_name, department_code)
VALUES
('Computer Science and Engineering', 'CSE'),
('Computer Science and Artificial Intelligence', 'CSE-AI'),
('Electronics and Communication Engineering', 'ECE'),
('Mechanical Engineering', 'MECH')
ON CONFLICT DO NOTHING;

INSERT INTO users (email, password_hash, role)
VALUES
('admin@college.edu', 'CHANGE_ME', 'ADMIN'),
('alumni1@college.edu', 'CHANGE_ME', 'ALUMNI'),
('alumni2@college.edu', 'CHANGE_ME', 'ALUMNI')
ON CONFLICT DO NOTHING;

INSERT INTO alumni
(user_id, first_name, last_name, phone, graduation_year, department_id, current_company, designation, location)
VALUES
(2, 'Aarav', 'Sharma', '9876543210', 2022, 1, 'TechCorp', 'Software Engineer', 'Bengaluru'),
(3, 'Ananya', 'Rao', '9876543211', 2023, 2, 'AI Labs', 'ML Engineer', 'Hyderabad')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO companies (company_name, industry, location)
VALUES
('TechCorp', 'Information Technology', 'Bengaluru'),
('AI Labs', 'Artificial Intelligence', 'Hyderabad')
ON CONFLICT DO NOTHING;
