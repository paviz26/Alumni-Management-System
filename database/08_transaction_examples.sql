BEGIN;

INSERT INTO event_registrations (event_id, alumni_id)
VALUES (1, 1);

-- COMMIT when validated.
-- ROLLBACK if any dependent operation fails.

COMMIT;
