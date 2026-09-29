from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_compatibility() -> None:
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS departments (
                department_id SERIAL PRIMARY KEY,
                department_name VARCHAR(150) NOT NULL UNIQUE,
                department_code VARCHAR(50) UNIQUE
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(150) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'ALUMNI',
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS companies (
                company_id SERIAL PRIMARY KEY,
                company_name VARCHAR(150) NOT NULL UNIQUE,
                industry VARCHAR(100),
                location VARCHAR(100),
                website_url TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alumni (
                alumni_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                department_id INT,
                company_id INT,
                current_company VARCHAR(150),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                graduation_year INT,
                designation VARCHAR(150),
                location VARCHAR(150),
                bio TEXT,
                linkedin_url TEXT,
                github_url TEXT,
                verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                verified BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
                FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS students (
                student_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                department_id INT,
                registration_number VARCHAR(50) NOT NULL UNIQUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS faculty (
                faculty_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                department_id INT,
                designation VARCHAR(150),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS events (
                event_id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                event_date TIMESTAMP NOT NULL,
                venue VARCHAR(200),
                capacity INT,
                type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                created_by INT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS event_registrations (
                registration_id SERIAL PRIMARY KEY,
                event_id INT NOT NULL,
                alumni_id INT NOT NULL,
                registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                attendance_status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
                UNIQUE (event_id, alumni_id),
                FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
                FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS connections (
                connection_id SERIAL PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                requested_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                accepted_on TIMESTAMP,
                UNIQUE (sender_id, receiver_id),
                FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mentorship (
                mentorship_id SERIAL PRIMARY KEY,
                student_id INT NOT NULL,
                alumni_id INT NOT NULL,
                area_of_interest VARCHAR(100),
                message TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                requested_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
                FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS achievements (
                achievement_id SERIAL PRIMARY KEY,
                alumni_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                achievement_date DATE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS announcements (
                announcement_id SERIAL PRIMARY KEY,
                user_id INT,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS job_postings (
                job_id SERIAL PRIMARY KEY,
                posted_by INT,
                company VARCHAR(200),
                job_title VARCHAR(200) NOT NULL,
                description TEXT,
                location VARCHAR(150),
                job_type VARCHAR(30),
                deadline DATE,
                application_link TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (posted_by) REFERENCES alumni(alumni_id) ON DELETE SET NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS job_applications (
                application_id SERIAL PRIMARY KEY,
                job_id INT NOT NULL,
                student_id INT NOT NULL,
                applied_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                UNIQUE (job_id, student_id),
                FOREIGN KEY (job_id) REFERENCES job_postings(job_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'INFO',
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS event_invites (
                invite_id SERIAL PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT NOT NULL,
                invited_by INT,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                invited_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (event_id, user_id),
                FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (invited_by) REFERENCES users(user_id) ON DELETE SET NULL
            );
        """))

        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)"))

        conn.execute(text("ALTER TABLE alumni ADD COLUMN IF NOT EXISTS current_company VARCHAR(150)"))
        conn.execute(text("ALTER TABLE alumni ADD COLUMN IF NOT EXISTS company_id INT"))
        conn.execute(text("ALTER TABLE alumni ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'PENDING'"))
        conn.execute(text("ALTER TABLE alumni ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE"))

        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50)"))
        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INT"))
        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))

        conn.execute(text("ALTER TABLE mentorship ADD COLUMN IF NOT EXISTS area_of_interest VARCHAR(100)"))
        conn.execute(text("ALTER TABLE mentorship ADD COLUMN IF NOT EXISTS message TEXT"))
        conn.execute(text("ALTER TABLE mentorship ADD COLUMN IF NOT EXISTS requested_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        conn.execute(text("ALTER TABLE mentorship ADD COLUMN IF NOT EXISTS student_id INT"))
        conn.execute(text("ALTER TABLE mentorship ADD COLUMN IF NOT EXISTS alumni_id INT"))

        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'GENERAL'"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'"))

        conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS company VARCHAR(200)"))
        conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS job_title VARCHAR(200)"))
        conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS job_type VARCHAR(30)"))
        conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS application_link TEXT"))

        conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
