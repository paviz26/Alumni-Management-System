-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- TRANSACTION EXAMPLES
-- ============================================================


-- ============================================================
-- 1. COMMIT TRANSACTION
-- Demonstrates a successful transaction.
-- The transaction is committed and then the test record
-- is removed so the sample database remains unchanged.
-- ============================================================

BEGIN;

INSERT INTO announcements
    (title, content, created_by)
VALUES
    (
        'Transaction Commit Test',
        'Temporary record used to demonstrate COMMIT.',
        1
    );

-- Validate the inserted record
SELECT *
FROM announcements
WHERE title = 'Transaction Commit Test';

COMMIT;


-- Clean up test record
DELETE FROM announcements
WHERE title = 'Transaction Commit Test';


-- ============================================================
-- 2. ROLLBACK TRANSACTION
-- Demonstrates cancelling a transaction.
-- ============================================================

BEGIN;

INSERT INTO announcements
    (title, content, created_by)
VALUES
    (
        'Transaction Rollback Test',
        'This record will be removed using ROLLBACK.',
        1
    );

-- Cancel the transaction
ROLLBACK;


-- Verify that the record does not exist
SELECT *
FROM announcements
WHERE title = 'Transaction Rollback Test';


-- ============================================================
-- 3. SAVEPOINT
-- Demonstrates partial rollback inside a transaction.
-- ============================================================

BEGIN;

INSERT INTO announcements
    (title, content, created_by)
VALUES
    (
        'Savepoint Test 1',
        'This record is created before the savepoint.',
        1
    );

SAVEPOINT announcement_savepoint;

INSERT INTO announcements
    (title, content, created_by)
VALUES
    (
        'Savepoint Test 2',
        'This record will be rolled back.',
        1
    );

-- Roll back only the second insertion
ROLLBACK TO SAVEPOINT announcement_savepoint;

COMMIT;


-- Clean up the record that remained after the savepoint
DELETE FROM announcements
WHERE title = 'Savepoint Test 1';


-- ============================================================
-- 4. EVENT REGISTRATION TRANSACTION
-- Demonstrates a transaction involving event registration.
-- The registration is temporarily inserted and then removed.
-- ============================================================

BEGIN;

-- Event 2 and alumni 5 are used for demonstration.
-- The existing sample registration for this combination
-- should not already exist.

INSERT INTO event_registrations
    (event_id, alumni_id)
VALUES
    (2, 5);

-- Verify the registration
SELECT
    event_id,
    alumni_id,
    attendance_status
FROM event_registrations
WHERE event_id = 2
  AND alumni_id = 5;

COMMIT;


-- Remove the temporary demonstration record
DELETE FROM event_registrations
WHERE event_id = 2
  AND alumni_id = 5;


-- ============================================================
-- 5. ROLLBACK AFTER VALIDATION
-- Demonstrates cancelling an UPDATE operation.
-- ============================================================

BEGIN;

UPDATE mentorship
SET status = 'ACCEPTED'
WHERE mentorship_id = 2;

-- Check the temporary change
SELECT
    mentorship_id,
    mentor_id,
    mentee_id,
    status
FROM mentorship
WHERE mentorship_id = 2;

-- Cancel the update
ROLLBACK;


-- Verify that the original value has been restored
SELECT
    mentorship_id,
    mentor_id,
    mentee_id,
    status
FROM mentorship
WHERE mentorship_id = 2;


-- ============================================================
-- END OF TRANSACTION EXAMPLES
-- ============================================================