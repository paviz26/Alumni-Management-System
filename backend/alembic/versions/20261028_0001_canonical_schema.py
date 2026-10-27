"""Create the canonical application schema and preserve legacy records.

Revision ID: 20261028_0001
Revises:
"""
from __future__ import annotations

from pathlib import Path

from alembic import op
import sqlalchemy as sa

from app.db.database import Base
from app.db import models  # noqa: F401

revision = "20261028_0001"
down_revision = None
branch_labels = None
depends_on = None


def _columns(bind, table: str) -> set[str]:
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table)} if table in inspector.get_table_names() else set()


def _run_sql_script(bind, path: Path) -> None:
    """Execute SQL statements while respecting dollar-quoted function bodies."""
    source = path.read_text(encoding="utf-8")
    statements: list[str] = []
    buffer: list[str] = []
    single = double = False
    dollar_tag: str | None = None
    index = 0
    while index < len(source):
        if not single and not double and source[index] == "$":
            end = source.find("$", index + 1)
            if end != -1:
                tag = source[index:end + 1]
                if tag[1:-1].replace("_", "").isalnum() or tag == "$$":
                    if dollar_tag is None:
                        dollar_tag = tag
                    elif dollar_tag == tag:
                        dollar_tag = None
                    buffer.append(tag)
                    index = end + 1
                    continue
        char = source[index]
        if dollar_tag is None:
            if char == "'" and not double:
                if single and index + 1 < len(source) and source[index + 1] == "'":
                    buffer.extend(("'", "'"))
                    index += 2
                    continue
                single = not single
            elif char == '"' and not single:
                double = not double
            elif char == ";" and not single and not double:
                statement = "".join(buffer).strip()
                if statement:
                    statements.append(statement)
                buffer.clear()
                index += 1
                continue
        buffer.append(char)
        index += 1
    tail = "".join(buffer).strip()
    if tail:
        statements.append(tail)
    for statement in statements:
        statement = "\n".join(line for line in statement.splitlines() if not line.lstrip().startswith("--")).strip()
        if statement:
            bind.exec_driver_sql(statement)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        raise RuntimeError("The canonical schema migration targets PostgreSQL")
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names()) - {"alembic_version"}

    # Remove only derived objects so they can be recreated against the canonical tables.
    bind.exec_driver_sql("DROP VIEW IF EXISTS alumni_directory, event_participation, alumni_career, job_opportunities, mentorship_directory, donation_summary, alumni_event_history, department_alumni_summary")
    bind.exec_driver_sql("DROP FUNCTION IF EXISTS get_alumni_count_by_department(INT), get_total_completed_donations(), get_event_registration_count(INT), get_alumni_donation_total(INT), get_alumni_name(INT), get_jobs_posted_by_alumni(INT)")

    tables = {item["name"] for item in inspector.get_table_names()}
    if "mentorship" in tables:
        columns = _columns(bind, "mentorship")
        if {"mentor_id", "mentee_id"} <= columns:
            if "mentorship_alumni_legacy" in tables:
                raise RuntimeError("Both mentorship and mentorship_alumni_legacy exist; reconcile them manually before migrating")
            op.rename_table("mentorship", "mentorship_alumni_legacy")

    tables = {item["name"] for item in sa.inspect(bind).get_table_names()}
    if "jobs" in tables and "job_postings" in tables:
        # Keep the SQL-era rows intact while making the active runtime posting table canonical.
        if "jobs_sql_legacy" in tables:
            raise RuntimeError("jobs_sql_legacy already exists; inspect prior migration state before continuing")
        op.rename_table("jobs", "jobs_sql_legacy")
        op.rename_table("job_postings", "jobs")
        cols = _columns(bind, "jobs")
        for old, new in (("job_title", "title"), ("job_type", "employment_type"), ("application_link", "application_url")):
            if old in cols and new not in cols:
                op.alter_column("jobs", old, new_column_name=new)
        cols = _columns(bind, "jobs")
        if "company_id" not in cols:
            op.add_column("jobs", sa.Column("company_id", sa.Integer(), nullable=True))
    elif "job_postings" in tables and "jobs" not in tables:
        op.rename_table("job_postings", "jobs")
        cols = _columns(bind, "jobs")
        for old, new in (("job_title", "title"), ("job_type", "employment_type"), ("application_link", "application_url")):
            if old in cols and new not in cols:
                op.alter_column("jobs", old, new_column_name=new)
        cols = _columns(bind, "jobs")
        if "company_id" not in cols:
            op.add_column("jobs", sa.Column("company_id", sa.Integer(), nullable=True))

    tables = {item["name"] for item in sa.inspect(bind).get_table_names()}
    if "jobs" in tables:
        cols = _columns(bind, "jobs")
        for name, column in (
            ("company", sa.Column("company", sa.String(200), nullable=True)),
            ("company_id", sa.Column("company_id", sa.Integer(), nullable=True)),
        ):
            if name not in cols:
                op.add_column("jobs", column)
        cols = _columns(bind, "jobs")
        if {"company_id", "company"} <= cols and "companies" in tables:
            bind.exec_driver_sql("UPDATE jobs j SET company = c.company_name FROM companies c WHERE j.company_id = c.company_id AND j.company IS NULL")

    # Existing runtime tables need additive fields. Existing SQL-era creator/timestamp columns
    # are renamed to their ORM-backed canonical names without deleting values.
    if "users" in tables:
        cols = _columns(bind, "users")
        for name, sql_type in (("first_name", "VARCHAR(100)"), ("last_name", "VARCHAR(100)")):
            if name not in cols:
                bind.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {name} {sql_type}")
    if "alumni" in tables:
        cols = _columns(bind, "alumni")
        for name, sql_type, default in (
            ("current_company", "VARCHAR(150)", None),
            ("verification_status", "VARCHAR(20)", "'PENDING'"),
            ("verified", "BOOLEAN", "FALSE"),
        ):
            if name not in cols:
                suffix = f" DEFAULT {default}" if default is not None else ""
                bind.exec_driver_sql(f"ALTER TABLE alumni ADD COLUMN {name} {sql_type}{suffix}")
    if "events" in tables:
        cols = _columns(bind, "events")
        if "type" not in cols:
            bind.exec_driver_sql("ALTER TABLE events ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'GENERAL'")
        if "status" not in cols:
            bind.exec_driver_sql("ALTER TABLE events ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING'")
    if "announcements" in tables:
        cols = _columns(bind, "announcements")
        if "user_id" in cols and "created_by" not in cols:
            op.alter_column("announcements", "user_id", new_column_name="created_by")
        cols = _columns(bind, "announcements")
        if "created_on" in cols and "published_at" not in cols:
            op.alter_column("announcements", "created_on", new_column_name="published_at")

    # Create missing tables only. This does not drop or replace existing records.
    models_present = Base.metadata
    models_present.create_all(bind=bind)

    # Add the constraints that create_all cannot retrofit onto legacy tables.
    checks = [
        ("users", "ck_users_role", "role IN ('ADMIN', 'ALUMNI', 'STUDENT', 'FACULTY')"),
        ("alumni", "ck_alumni_graduation_year", "graduation_year IS NULL OR graduation_year BETWEEN 1950 AND 2100"),
        ("alumni", "ck_alumni_verification_status", "verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')"),
        ("events", "ck_events_capacity", "capacity IS NULL OR capacity > 0"),
        ("events", "ck_events_status", "status IN ('PENDING', 'APPROVED', 'CANCELLED')"),
        ("event_registrations", "ck_event_registration_status", "attendance_status IN ('REGISTERED', 'ATTENDED', 'CANCELLED')"),
        ("connections", "ck_connections_not_self", "sender_id <> receiver_id"),
        ("connections", "ck_connections_status", "status IN ('PENDING', 'ACCEPTED', 'REJECTED')"),
        ("mentorship", "ck_mentorship_participants", "student_id IS NOT NULL AND alumni_id IS NOT NULL"),
        ("mentorship", "ck_mentorship_status", "status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')"),
        ("job_applications", "ck_job_application_status", "status IN ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')"),
        ("announcements", "ck_announcement_status", "status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')"),
        ("event_invites", "ck_event_invite_status", "status IN ('PENDING', 'ACCEPTED', 'DECLINED')"),
        ("donations", "ck_donations_positive_amount", "amount > 0"),
        ("donations", "ck_donations_status", "payment_status IN ('PENDING', 'COMPLETED', 'FAILED')"),
    ]
    for table, name, expression in checks:
        existing_checks = sa.inspect(bind).get_check_constraints(table)
        if not any(name == item.get("name") for item in existing_checks):
            bind.exec_driver_sql(f"ALTER TABLE {table} ADD CONSTRAINT {name} CHECK ({expression})")

    unique_specs = [
        ("event_registrations", "uq_event_registrations_event_alumni", ("event_id", "alumni_id")),
        ("connections", "uq_connections_direction", ("sender_id", "receiver_id")),
        ("mentorship", "uq_mentorship_student_mentor", ("student_id", "alumni_id")),
        ("job_applications", "uq_job_applications_job_student", ("job_id", "student_id")),
        ("event_invites", "uq_event_invites_event_user", ("event_id", "user_id")),
    ]
    for table, name, columns in unique_specs:
        unique_constraints = sa.inspect(bind).get_unique_constraints(table)
        if not any(tuple(item.get("column_names") or ()) == columns for item in unique_constraints):
            duplicates = bind.execute(sa.text(
                f"SELECT 1 FROM {table} GROUP BY {', '.join(columns)} HAVING count(*) > 1 LIMIT 1"
            )).first()
            if duplicates:
                raise RuntimeError(f"Duplicate rows prevent adding {name}; reconcile records before rerunning migration")
            bind.exec_driver_sql(f"ALTER TABLE {table} ADD CONSTRAINT {name} UNIQUE ({', '.join(columns)})")

    mentorship_nulls = bind.execute(sa.text("SELECT 1 FROM mentorship WHERE student_id IS NULL OR alumni_id IS NULL LIMIT 1")).first()
    if mentorship_nulls:
        raise RuntimeError("Mentorship rows have missing participants; repair them before enforcing student-to-alumni mentorship")
    bind.exec_driver_sql("ALTER TABLE mentorship ALTER COLUMN student_id SET NOT NULL")
    bind.exec_driver_sql("ALTER TABLE mentorship ALTER COLUMN alumni_id SET NOT NULL")

    for name, table, column in (
        ("idx_alumni_graduation_year", "alumni", "graduation_year"),
        ("idx_alumni_department", "alumni", "department_id"),
        ("idx_alumni_company", "alumni", "company_id"),
        ("idx_events_date", "events", "event_date"),
        ("idx_jobs_deadline", "jobs", "deadline"),
        ("idx_jobs_company", "jobs", "company"),
        ("idx_jobs_company_id", "jobs", "company_id"),
        ("idx_event_registrations_alumni", "event_registrations", "alumni_id"),
        ("idx_mentorship_mentor", "mentorship", "alumni_id"),
        ("idx_mentorship_mentee", "mentorship", "student_id"),
    ):
        table_indexes = sa.inspect(bind).get_indexes(table)
        if not any((item.get("column_names") or []) == [column] for item in table_indexes):
            # PostgreSQL index names are schema-wide; a renamed legacy table can
            # still own one of the expected names.
            name_exists = bind.execute(sa.text(
                "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name"
            ), {"name": name}).first()
            index_name = f"{name}_canonical" if name_exists else name
            bind.exec_driver_sql(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({column})")

    # The legacy SQL mentorship rows remain untouched in mentorship_alumni_legacy.
    repo_root = Path(__file__).resolve().parents[3]
    for filename in ("04_views.sql", "05_functions.sql", "06_triggers.sql"):
        _run_sql_script(bind, repo_root / "database" / filename)


def downgrade() -> None:
    raise RuntimeError("This data-preserving migration has no automatic downgrade; restore a verified backup instead")
