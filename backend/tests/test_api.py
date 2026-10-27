from datetime import datetime, timedelta

from app.db.models import Alumni, Student, User


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_health_and_auth_contract(client, make_user):
    assert client.get("/api/health").json()["status"] == "ok"
    token, user_id = make_user("STUDENT")
    assert user_id > 0
    response = client.get("/api/alumni", headers=auth(token))
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_registration_roles_and_admin_protection(client, make_user):
    for role in ("STUDENT", "ALUMNI", "FACULTY"):
        make_user(role)
    denied = client.post("/api/auth/register", json={
        "firstName": "Root", "lastName": "User", "email": "root@example.test",
        "password": "secure-password", "role": "ADMIN",
    })
    assert denied.status_code == 422
    assert denied.json()["success"] is False


def test_registration_duplicate_identifiers_are_atomic(client, db_session):
    first = {
        "firstName": "One", "lastName": "Student", "email": "first@example.test",
        "password": "secure-password", "role": "STUDENT", "registrationNumber": "REG-SAME",
    }
    assert client.post("/api/auth/register", json=first).status_code == 201
    duplicate = {**first, "email": "second@example.test"}
    response = client.post("/api/auth/register", json=duplicate)
    assert response.status_code == 409
    assert db_session.query(User).filter(User.email == "second@example.test").count() == 0
    assert db_session.query(Student).filter(Student.registration_number == "REG-SAME").count() == 1


def test_invalid_role_specific_fields_do_not_create_user(client, db_session):
    payload = {
        "firstName": "No", "lastName": "Profile", "email": "invalid-profile@example.test",
        "password": "secure-password", "role": "ALUMNI", "graduationYear": 2020,
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert db_session.query(User).filter(User.email == payload["email"]).count() == 0


def test_login_invalid_credentials(client, make_user):
    token, user_id = make_user("STUDENT", email="login@example.test")
    response = client.post("/api/auth/login", json={"email": "login@example.test", "password": "wrong-password"})
    assert response.status_code == 401
    assert response.json()["success"] is False


def test_profile_response_hides_other_users_email(client, make_user):
    token, _ = make_user("ALUMNI")
    own = client.get("/api/alumni/me", headers=auth(token))
    assert own.status_code == 200
    assert "email" in own.json()
    directory = client.get("/api/alumni", headers=auth(token)).json()
    assert "email" not in directory["alumni"][0]


def test_faculty_routes_require_faculty_role(client, make_user):
    student_token, _ = make_user("STUDENT")
    response = client.get("/api/faculty/students", headers=auth(student_token))
    assert response.status_code == 403
    faculty_token, _ = make_user("FACULTY")
    assert client.get("/api/faculty/students", headers=auth(faculty_token)).status_code == 200


def test_admin_route_requires_admin(client, make_user):
    student_token, _ = make_user("STUDENT")
    assert client.get("/api/admin/statistics", headers=auth(student_token)).status_code == 403
    admin_token, _ = make_user("ADMIN")
    assert client.get("/api/admin/statistics", headers=auth(admin_token)).status_code == 200


def test_mentorship_participant_permissions_and_transitions(client, make_user):
    student_token, _ = make_user("STUDENT")
    other_student_token, _ = make_user("STUDENT")
    mentor_token, _ = make_user("ALUMNI")
    mentor_profile = client.get("/api/alumni/me", headers=auth(mentor_token)).json()
    created = client.post("/api/mentorship", headers=auth(student_token), json={
        "mentor_id": mentor_profile["alumniId"], "area_of_interest": "Databases", "message": "Please advise",
    })
    assert created.status_code == 201
    mentorship_id = created.json()["mentorshipId"]
    forbidden = client.put(f"/api/mentorship/{mentorship_id}", headers=auth(other_student_token), json={"status": "ACCEPTED"})
    assert forbidden.status_code == 403
    accepted = client.put(f"/api/mentorship/{mentorship_id}", headers=auth(mentor_token), json={"status": "ACCEPTED"})
    assert accepted.status_code == 200
    completed = client.put(f"/api/mentorship/{mentorship_id}", headers=auth(mentor_token), json={"status": "COMPLETED"})
    assert completed.status_code == 200
    invalid_transition = client.put(f"/api/mentorship/{mentorship_id}", headers=auth(mentor_token), json={"status": "REJECTED"})
    assert invalid_transition.status_code == 409


def test_event_capacity_duplicate_and_cancellation(client, make_user):
    faculty_token, _ = make_user("FACULTY")
    admin_token, _ = make_user("ADMIN")
    first_alumni, _ = make_user("ALUMNI")
    second_alumni, _ = make_user("ALUMNI")
    created = client.post("/api/events", headers=auth(faculty_token), json={
        "title": "Capacity Test", "eventDate": (datetime.utcnow() + timedelta(days=20)).isoformat(),
        "capacity": 1,
    })
    assert created.status_code == 201
    event_id = created.json()["eventId"]
    assert client.get("/api/events/upcoming", headers=auth(first_alumni)).json() == []
    approved = client.put(f"/api/admin/approve-event/{event_id}", headers=auth(admin_token))
    assert approved.status_code == 200
    registration = client.post(f"/api/events/{event_id}/register", headers=auth(first_alumni))
    assert registration.status_code == 201
    duplicate = client.post(f"/api/events/{event_id}/register", headers=auth(first_alumni))
    assert duplicate.status_code == 409
    full = client.post(f"/api/events/{event_id}/register", headers=auth(second_alumni))
    assert full.status_code == 409
    cancel = client.delete(f"/api/events/registrations/{registration.json()['registrationId']}", headers=auth(first_alumni))
    assert cancel.status_code == 200
    assert client.post(f"/api/events/{event_id}/register", headers=auth(second_alumni)).status_code == 201


def test_job_owner_and_duplicate_application(client, make_user):
    alumni_token, _ = make_user("ALUMNI")
    student_token, _ = make_user("STUDENT")
    other_alumni_token, _ = make_user("ALUMNI")
    job = client.post("/api/jobs", headers=auth(alumni_token), json={
        "title": "API Engineer", "company": "Example Inc", "deadline": "2035-01-01",
        "applicationUrl": "https://example.test/jobs/1",
    })
    assert job.status_code == 201
    job_id = job.json()["jobId"]
    assert client.put(f"/api/jobs/{job_id}", headers=auth(other_alumni_token), json={"title": "Tamper"}).status_code == 403
    assert client.post(f"/api/jobs/{job_id}/apply", headers=auth(student_token)).status_code == 201
    assert client.post(f"/api/jobs/{job_id}/apply", headers=auth(student_token)).status_code == 409


def test_donation_recording_privacy_and_admin_totals(client, make_user):
    student_token, _ = make_user("STUDENT")
    alumni_token, _ = make_user("ALUMNI")
    admin_token, _ = make_user("ADMIN")
    assert client.post("/api/donations", headers=auth(student_token), json={"amount": "10.00"}).status_code == 403
    made = client.post("/api/donations", headers=auth(alumni_token), json={"amount": "125.50", "purpose": "Scholarship"})
    assert made.status_code == 201
    donation_id = made.json()["donation"]["donationId"]
    assert client.get("/api/donations", headers=auth(alumni_token)).status_code == 403
    assert len(client.get("/api/donations/me", headers=auth(alumni_token)).json()) == 1
    assert client.put(f"/api/donations/{donation_id}/status", headers=auth(admin_token), json={"payment_status": "COMPLETED"}).status_code == 200
    assert client.get("/api/donations/summary", headers=auth(admin_token)).json()["completedTotal"] == "125.50"


def test_announcement_creator_and_admin_controls(client, make_user):
    faculty_token, _ = make_user("FACULTY")
    other_faculty_token, _ = make_user("FACULTY")
    created = client.post("/api/announcements", headers=auth(faculty_token), json={"title": "Update", "content": "Details"})
    assert created.status_code == 201
    announcement_id = created.json()["announcementId"]
    assert client.put(f"/api/announcements/{announcement_id}", headers=auth(other_faculty_token), json={"title": "No", "content": "No"}).status_code == 403
    assert client.put(f"/api/announcements/{announcement_id}", headers=auth(faculty_token), json={"title": "Updated", "content": "Details"}).status_code == 200

