import os

# Never inherit a developer or production database URL into the API test process.
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-key-with-at-least-32-characters"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["CORS_ALLOWED_ORIGINS"] = "http://localhost:3000"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.main import app


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def make_user(client, db_session):
    def create(role="STUDENT", email=None, **extra):
        import uuid
        from app.core.security import hash_password
        from app.db.models import User

        email = email or f"{uuid.uuid4().hex}@example.test"
        if role == "ADMIN":
            user = User(email=email, password_hash=hash_password("test-password-123"), role="ADMIN", first_name="Test", last_name="Admin")
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
            response = client.post("/api/auth/login", json={"email": email, "password": "test-password-123"})
            assert response.status_code == 200, response.text
            return response.json()["token"], user.user_id
        payload = {
            "firstName": "Test",
            "lastName": role.title(),
            "email": email,
            "password": "test-password-123",
            "role": role,
            **extra,
        }
        if role == "STUDENT":
            payload.setdefault("registrationNumber", f"REG-{uuid.uuid4().hex[:12]}")
        elif role == "ALUMNI":
            payload.setdefault("graduationYear", 2020)
            payload.setdefault("company", "Example Co")
            payload.setdefault("jobTitle", "Engineer")
        elif role == "FACULTY":
            payload.setdefault("designation", "Professor")
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201, response.text
        login = client.post("/api/auth/login", json={"email": email, "password": payload["password"]})
        assert login.status_code == 200, login.text
        return login.json()["token"], login.json()["user"]["userId"]

    return create
