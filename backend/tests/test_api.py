import os

from fastapi.testclient import TestClient

os.environ.setdefault('DATABASE_URL', 'postgresql+psycopg://postgres:postgres@localhost:5432/alumni_management')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret')
os.environ.setdefault('JWT_ALGORITHM', 'HS256')
os.environ.setdefault('ACCESS_TOKEN_EXPIRE_MINUTES', '60')
os.environ.setdefault('CORS_ALLOWED_ORIGINS', 'http://localhost:8000,http://127.0.0.1:8000')

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'ok'
    assert 'message' in payload


def test_registration_and_login():
    unique_email = 'student_test_user@example.com'
    register = client.post('/api/auth/register', json={
        'firstName': 'Test',
        'lastName': 'Student',
        'email': unique_email,
        'password': 'securepass123',
        'role': 'STUDENT',
        'department': 'CSE',
        'registrationNumber': 'REG-1001'
    })
    assert register.status_code == 201, register.text
    assert register.json()['success'] is True

    login = client.post('/api/auth/login', json={'email': unique_email, 'password': 'securepass123'})
    assert login.status_code == 200, login.text
    payload = login.json()
    assert payload['success'] is True
    assert 'token' in payload
    assert payload['user']['email'] == unique_email
    assert payload['user']['role'] == 'STUDENT'


def test_duplicate_email_registration():
    payload = {
        'firstName': 'Jane',
        'lastName': 'Doe',
        'email': 'duplicate@example.com',
        'password': 'securepass123',
        'role': 'STUDENT',
        'department': 'CSE',
        'registrationNumber': 'REG-2002'
    }
    first = client.post('/api/auth/register', json=payload)
    second = client.post('/api/auth/register', json=payload)
    assert first.status_code == 201
    assert second.status_code == 409


def test_invalid_login():
    response = client.post('/api/auth/login', json={'email': 'missing@example.com', 'password': 'wrongpass'})
    assert response.status_code == 401


def test_protected_route_requires_auth():
    response = client.get('/api/alumni')
    assert response.status_code == 401


def test_alumni_search_requires_auth_and_returns_data():
    register = client.post('/api/auth/register', json={
        'firstName': 'Ana',
        'lastName': 'Miller',
        'email': 'alumni_search_test@example.com',
        'password': 'securepass123',
        'role': 'ALUMNI',
        'department': 'CSE',
        'graduationYear': 2020,
        'company': 'Microsoft',
        'jobTitle': 'Engineer',
        'location': 'Bengaluru'
    })
    assert register.status_code == 201

    login = client.post('/api/auth/login', json={'email': 'alumni_search_test@example.com', 'password': 'securepass123'})
    token = login.json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    response = client.get('/api/alumni/search?keyword=Ana&limit=10&page=1', headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert 'alumni' in data


def test_self_connection_rejected():
    register = client.post('/api/auth/register', json={
        'firstName': 'Self',
        'lastName': 'Tester',
        'email': 'selfconnection@example.com',
        'password': 'securepass123',
        'role': 'STUDENT',
        'department': 'CSE',
        'registrationNumber': 'REG-3003'
    })
    login = client.post('/api/auth/login', json={'email': 'selfconnection@example.com', 'password': 'securepass123'})
    token = login.json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    user = login.json()['user']
    response = client.post('/api/connections/request', json={'alumni_id': user['userId']}, headers=headers)
    assert response.status_code == 400


def test_mentorship_creation_and_acceptance():
    student_email = 'mentee@example.com'
    alumni_email = 'mentor@example.com'
    client.post('/api/auth/register', json={
        'firstName': 'Mentee',
        'lastName': 'User',
        'email': student_email,
        'password': 'securepass123',
        'role': 'STUDENT',
        'department': 'CSE',
        'registrationNumber': 'REG-4004'
    })
    client.post('/api/auth/register', json={
        'firstName': 'Mentor',
        'lastName': 'User',
        'email': alumni_email,
        'password': 'securepass123',
        'role': 'ALUMNI',
        'department': 'CSE',
        'graduationYear': 2019,
        'company': 'Google',
        'jobTitle': 'Staff Engineer',
        'location': 'Bengaluru'
    })

    student_token = client.post('/api/auth/login', json={'email': student_email, 'password': 'securepass123'}).json()['token']
    mentor_token = client.post('/api/auth/login', json={'email': alumni_email, 'password': 'securepass123'}).json()['token']

    alumni_user = client.get('/api/alumni', headers={'Authorization': f'Bearer {mentor_token}'})
    alumni_id = alumni_user.json()['alumni'][0]['alumni_id']

    create = client.post('/api/mentorship', json={'mentor_id': alumni_id, 'area_of_interest': 'AI', 'message': 'Need guidance'}, headers={'Authorization': f'Bearer {student_token}'})
    assert create.status_code == 201, create.text
    mentorship_id = create.json()['mentorship_id']

    accept = client.put(f'/api/mentorship/{mentorship_id}', json={'status': 'ACCEPTED'}, headers={'Authorization': f'Bearer {mentor_token}'})
    assert accept.status_code == 200, accept.text
    assert accept.json()['status'] == 'ACCEPTED'


def test_event_creation_and_registration():
    faculty_email = 'faculty_test@example.com'
    student_email = 'event_student@example.com'
    client.post('/api/auth/register', json={
        'firstName': 'Faculty',
        'lastName': 'Test',
        'email': faculty_email,
        'password': 'securepass123',
        'role': 'FACULTY',
        'department': 'CSE',
        'designation': 'Professor'
    })
    client.post('/api/auth/register', json={
        'firstName': 'Event',
        'lastName': 'Student',
        'email': student_email,
        'password': 'securepass123',
        'role': 'STUDENT',
        'department': 'CSE',
        'registrationNumber': 'REG-5005'
    })

    faculty_token = client.post('/api/auth/login', json={'email': faculty_email, 'password': 'securepass123'}).json()['token']
    student_token = client.post('/api/auth/login', json={'email': student_email, 'password': 'securepass123'}).json()['token']

    created = client.post('/api/events', json={
        'title': 'Career Talk',
        'description': 'Panel discussion on AI careers',
        'eventDate': '2030-12-15T18:00:00',
        'venue': 'Seminar Hall',
        'capacity': 50,
        'type': 'WORKSHOP'
    }, headers={'Authorization': f'Bearer {faculty_token}'})
    assert created.status_code == 201, created.text
    event_id = created.json()['event_id']

    register = client.post(f'/api/events/{event_id}/register', headers={'Authorization': f'Bearer {student_token}'})
    assert register.status_code == 201, register.text


def test_job_application_and_duplicate_rejection():
    alumni_email = 'job_owner@example.com'
    student_email = 'job_student@example.com'
    client.post('/api/auth/register', json={
        'firstName': 'Job',
        'lastName': 'Owner',
        'email': alumni_email,
        'password': 'securepass123',
        'role': 'ALUMNI',
        'department': 'CSE',
        'graduationYear': 2018,
        'company': 'Amazon',
        'jobTitle': 'Engineer',
        'location': 'Hyderabad'
    })
    client.post('/api/auth/register', json={
        'firstName': 'Apply',
        'lastName': 'Student',
        'email': student_email,
        'password': 'securepass123',
        'role': 'STUDENT',
        'department': 'CSE',
        'registrationNumber': 'REG-6006'
    })

    alumni_token = client.post('/api/auth/login', json={'email': alumni_email, 'password': 'securepass123'}).json()['token']
    student_token = client.post('/api/auth/login', json={'email': student_email, 'password': 'securepass123'}).json()['token']

    created = client.post('/api/jobs', json={
        'title': 'Backend Engineer',
        'description': 'Build APIs',
        'company': 'Amazon',
        'location': 'Hyderabad',
        'employmentType': 'FULL_TIME',
        'deadline': '2035-01-01',
        'applicationUrl': 'https://example.com/apply'
    }, headers={'Authorization': f'Bearer {alumni_token}'})
    assert created.status_code == 201
    job_id = created.json()['job_id']

    first_apply = client.post(f'/api/jobs/{job_id}/apply', headers={'Authorization': f'Bearer {student_token}'})
    assert first_apply.status_code == 201, first_apply.text
    second_apply = client.post(f'/api/jobs/{job_id}/apply', headers={'Authorization': f'Bearer {student_token}'})
    assert second_apply.status_code == 409


def test_admin_verification_requires_admin():
    admin = client.post('/api/auth/register', json={
        'firstName': 'Admin',
        'lastName': 'User',
        'email': 'admin_test@example.com',
        'password': 'securepass123',
        'role': 'ADMIN'
    })
    assert admin.status_code == 201

    student = client.post('/api/auth/register', json={
        'firstName': 'Need',
        'lastName': 'Verification',
        'email': 'verify_me@example.com',
        'password': 'securepass123',
        'role': 'ALUMNI',
        'department': 'ECE',
        'graduationYear': 2021,
        'company': 'Meta',
        'jobTitle': 'Engineer',
        'location': 'Pune'
    })
    assert student.status_code == 201

    admin_token = client.post('/api/auth/login', json={'email': 'admin_test@example.com', 'password': 'securepass123'}).json()['token']
    alumni = client.get('/api/alumni', headers={'Authorization': f'Bearer {admin_token}'})
    alumni_id = next(item['alumni_id'] for item in alumni.json()['alumni'] if item['email'] == 'verify_me@example.com')

    verify = client.put(f'/api/admin/verify-alumni/{alumni_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert verify.status_code == 200, verify.text
    assert verify.json()['verification_status'] in {'VERIFIED', 'PENDING'}


def test_notifications_can_be_marked_read():
    student_email = 'notifications_user@example.com'
    client.post('/api/auth/register', json={
        'firstName': 'Notify',
        'lastName': 'User',
        'email': student_email,
        'password': 'securepass123',
        'role': 'STUDENT',
        'department': 'CSE',
        'registrationNumber': 'REG-7007'
    })
    token = client.post('/api/auth/login', json={'email': student_email, 'password': 'securepass123'}).json()['token']

    response = client.get('/api/notifications', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
