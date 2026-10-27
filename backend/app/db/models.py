from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Department(Base):
    __tablename__ = "departments"

    department_id: Mapped[int] = mapped_column(primary_key=True)
    department_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    department_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=True)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('ADMIN', 'ALUMNI', 'STUDENT', 'FACULTY')", name="ck_users_role"),)

    user_id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="ALUMNI")
    first_name: Mapped[str] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Company(Base):
    __tablename__ = "companies"

    company_id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    industry: Mapped[str] = mapped_column(String(100), nullable=True)
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    website_url: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Alumni(Base):
    __tablename__ = "alumni"
    __table_args__ = (
        CheckConstraint("graduation_year IS NULL OR graduation_year BETWEEN 1950 AND 2100", name="ck_alumni_graduation_year"),
        CheckConstraint("verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')", name="ck_alumni_verification_status"),
    )

    alumni_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.department_id", ondelete="SET NULL"), nullable=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.company_id", ondelete="SET NULL"), nullable=True, index=True)
    current_company: Mapped[str] = mapped_column(String(150), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    graduation_year: Mapped[int] = mapped_column(Integer, nullable=True, index=True)
    designation: Mapped[str] = mapped_column(String(150), nullable=True)
    location: Mapped[str] = mapped_column(String(150), nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    linkedin_url: Mapped[str] = mapped_column(Text, nullable=True)
    github_url: Mapped[str] = mapped_column(Text, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Student(Base):
    __tablename__ = "students"

    student_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.department_id", ondelete="SET NULL"), nullable=True)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Faculty(Base):
    __tablename__ = "faculty"

    faculty_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.department_id", ondelete="SET NULL"), nullable=True)
    designation: Mapped[str] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint("capacity IS NULL OR capacity > 0", name="ck_events_capacity"),
        CheckConstraint("status IN ('PENDING', 'APPROVED', 'CANCELLED')", name="ck_events_status"),
    )

    event_id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    venue: Mapped[str] = mapped_column(String(200), nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=True)
    type: Mapped[str] = mapped_column(String(50), default="GENERAL", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class EventRegistration(Base):
    __tablename__ = "event_registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "alumni_id", name="uq_event_registrations_event_alumni"),
        CheckConstraint("attendance_status IN ('REGISTERED', 'ATTENDED', 'CANCELLED')", name="ck_event_registration_status"),
    )

    registration_id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False)
    alumni_id: Mapped[int] = mapped_column(ForeignKey("alumni.alumni_id", ondelete="CASCADE"), nullable=False, index=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    attendance_status: Mapped[str] = mapped_column(String(20), default="REGISTERED", nullable=False)


class Connection(Base):
    __tablename__ = "connections"
    __table_args__ = (
        UniqueConstraint("sender_id", "receiver_id", name="uq_connections_direction"),
        CheckConstraint("sender_id <> receiver_id", name="ck_connections_not_self"),
        CheckConstraint("status IN ('PENDING', 'ACCEPTED', 'REJECTED')", name="ck_connections_status"),
    )

    connection_id: Mapped[int] = mapped_column(primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    requested_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_on: Mapped[datetime] = mapped_column(DateTime, nullable=True)


class Mentorship(Base):
    __tablename__ = "mentorship"
    __table_args__ = (
        UniqueConstraint("student_id", "alumni_id", name="uq_mentorship_student_mentor"),
        CheckConstraint("student_id IS NOT NULL AND alumni_id IS NOT NULL", name="ck_mentorship_participants"),
        CheckConstraint("status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')", name="ck_mentorship_status"),
    )

    mentorship_id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    alumni_id: Mapped[int] = mapped_column(ForeignKey("alumni.alumni_id", ondelete="CASCADE"), nullable=False)
    area_of_interest: Mapped[str] = mapped_column(String(100), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    requested_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Achievement(Base):
    __tablename__ = "achievements"

    achievement_id: Mapped[int] = mapped_column(primary_key=True)
    alumni_id: Mapped[int] = mapped_column(ForeignKey("alumni.alumni_id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    achievement_date: Mapped[datetime] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Announcement(Base):
    __tablename__ = "announcements"
    __table_args__ = (CheckConstraint("status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')", name="ck_announcement_status"),)

    announcement_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column("created_by", ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_on: Mapped[datetime] = mapped_column("published_at", DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PUBLISHED", nullable=False)


class JobPosting(Base):
    __tablename__ = "jobs"

    job_id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.company_id", ondelete="SET NULL"), nullable=True, index=True)
    posted_by: Mapped[int] = mapped_column(ForeignKey("alumni.alumni_id", ondelete="SET NULL"), nullable=True)
    company: Mapped[str] = mapped_column(String(200), nullable=True)
    job_title: Mapped[str] = mapped_column("title", String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(150), nullable=True)
    job_type: Mapped[str] = mapped_column("employment_type", String(30), nullable=True)
    deadline: Mapped[datetime] = mapped_column(Date, nullable=True, index=True)
    application_link: Mapped[str] = mapped_column("application_url", Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class JobApplication(Base):
    __tablename__ = "job_applications"
    __table_args__ = (
        UniqueConstraint("job_id", "student_id", name="uq_job_applications_job_student"),
        CheckConstraint("status IN ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')", name="ck_job_application_status"),
    )

    application_id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.job_id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    applied_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    notification_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="INFO", nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class EventInvite(Base):
    __tablename__ = "event_invites"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_invites_event_user"),
        CheckConstraint("status IN ('PENDING', 'ACCEPTED', 'DECLINED')", name="ck_event_invite_status"),
    )

    invite_id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    invited_by: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    invited_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Donation(Base):
    __tablename__ = "donations"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_donations_positive_amount"),
        CheckConstraint("payment_status IN ('PENDING', 'COMPLETED', 'FAILED')", name="ck_donations_status"),
    )

    donation_id: Mapped[int] = mapped_column(primary_key=True)
    alumni_id: Mapped[int] = mapped_column(ForeignKey("alumni.alumni_id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    donation_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    purpose: Mapped[str] = mapped_column(String(200), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
