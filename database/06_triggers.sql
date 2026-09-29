CREATE OR REPLACE FUNCTION prevent_invalid_graduation_year()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.graduation_year IS NOT NULL
       AND (NEW.graduation_year < 1950 OR NEW.graduation_year > EXTRACT(YEAR FROM CURRENT_DATE)::INT + 10) THEN
        RAISE EXCEPTION 'Invalid graduation year: %', NEW.graduation_year;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_graduation_year ON alumni;

CREATE TRIGGER trg_validate_graduation_year
BEFORE INSERT OR UPDATE ON alumni
FOR EACH ROW
EXECUTE FUNCTION prevent_invalid_graduation_year();
