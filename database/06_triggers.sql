-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- DATABASE TRIGGERS
-- ============================================================


-- ============================================================
-- TRIGGER 1: VALIDATE GRADUATION YEAR
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_invalid_graduation_year()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    IF NEW.graduation_year IS NOT NULL
       AND (
            NEW.graduation_year < 1950
            OR NEW.graduation_year >
               EXTRACT(YEAR FROM CURRENT_DATE)::INT + 10
       )
    THEN
        RAISE EXCEPTION
            'Invalid graduation year: %',
            NEW.graduation_year;
    END IF;

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS trg_validate_graduation_year
ON alumni;

CREATE TRIGGER trg_validate_graduation_year
BEFORE INSERT OR UPDATE ON alumni
FOR EACH ROW
EXECUTE FUNCTION prevent_invalid_graduation_year();


-- ============================================================
-- TRIGGER 2: PREVENT EVENT OVERBOOKING
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_event_overbooking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_registrations INT;
    event_capacity INT;
BEGIN

    SELECT capacity
    INTO event_capacity
    FROM events
    WHERE event_id = NEW.event_id;

    -- If the event has no capacity limit, allow registration
    IF event_capacity IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*)
    INTO current_registrations
    FROM event_registrations
    WHERE event_id = NEW.event_id;

    IF current_registrations >= event_capacity THEN
        RAISE EXCEPTION
            'Event % is already full. Registration cannot be completed.',
            NEW.event_id;
    END IF;

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS trg_prevent_event_overbooking
ON event_registrations;

CREATE TRIGGER trg_prevent_event_overbooking
BEFORE INSERT ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION prevent_event_overbooking();


-- ============================================================
-- TRIGGER 3: PREVENT INVALID MENTORSHIP STATUS CHANGE
-- ============================================================

CREATE OR REPLACE FUNCTION validate_mentorship_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    IF NEW.status NOT IN
       ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')
    THEN
        RAISE EXCEPTION
            'Invalid mentorship status: %',
            NEW.status;
    END IF;

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS trg_validate_mentorship_status
ON mentorship;

CREATE TRIGGER trg_validate_mentorship_status
BEFORE INSERT OR UPDATE ON mentorship
FOR EACH ROW
EXECUTE FUNCTION validate_mentorship_status();