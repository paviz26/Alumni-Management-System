"""Opt-in PostgreSQL race test; requires an explicitly disposable migrated test database."""
import os
import uuid
from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy import create_engine, text


@pytest.mark.skipif(
    os.getenv("ALUMNI_TEST_DB_DISPOSABLE") != "1" or not os.getenv("ALUMNI_TEST_DATABASE_URL"),
    reason="Set ALUMNI_TEST_DB_DISPOSABLE=1 and ALUMNI_TEST_DATABASE_URL to an isolated disposable PostgreSQL database",
)
def test_event_trigger_serializes_concurrent_registrations():
    url = os.environ["ALUMNI_TEST_DATABASE_URL"]
    if not url.startswith("postgresql"):
        pytest.fail("The concurrency test requires PostgreSQL")
    engine = create_engine(url, pool_size=12, max_overflow=0)
    token = uuid.uuid4().hex
    user_ids: list[int] = []
    event_id = None
    try:
        with engine.begin() as conn:
            user_ids = [
                conn.execute(
                    text("INSERT INTO users(email,password_hash,role) VALUES (:email,'test-only','ALUMNI') RETURNING user_id"),
                    {"email": f"race-{token}-{n}@example.test"},
                ).scalar_one()
                for n in range(8)
            ]
            alumni_ids = [
                conn.execute(text("INSERT INTO alumni(user_id,first_name,graduation_year) VALUES (:uid,'Race',2020) RETURNING alumni_id"), {"uid": uid}).scalar_one()
                for uid in user_ids
            ]
            event_id = conn.execute(text("INSERT INTO events(title,event_date,capacity) VALUES ('Race test', CURRENT_TIMESTAMP + INTERVAL '1 day', 1) RETURNING event_id")).scalar_one()

        def attempt(alumni_id):
            try:
                with engine.begin() as conn:
                    conn.execute(text("INSERT INTO event_registrations(event_id,alumni_id) VALUES (:eid,:aid)"), {"eid": event_id, "aid": alumni_id})
                return True
            except Exception:
                return False

        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(attempt, alumni_ids))
        assert sum(results) == 1
        with engine.connect() as conn:
            count = conn.execute(text("SELECT count(*) FROM event_registrations WHERE event_id=:eid"), {"eid": event_id}).scalar_one()
            assert count == 1
    finally:
        if event_id is not None:
            with engine.begin() as conn:
                conn.execute(text("DELETE FROM events WHERE event_id=:eid"), {"eid": event_id})
        if user_ids:
            with engine.begin() as conn:
                conn.execute(text("DELETE FROM users WHERE user_id = ANY(:ids)"), {"ids": user_ids})
        engine.dispose()
