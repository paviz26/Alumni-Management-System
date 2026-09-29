CREATE OR REPLACE FUNCTION get_alumni_count_by_department(p_department_id INT)
RETURNS INT
LANGUAGE SQL
AS $$
    SELECT COUNT(*)::INT
    FROM alumni
    WHERE department_id = p_department_id;
$$;

CREATE OR REPLACE FUNCTION get_total_completed_donations()
RETURNS NUMERIC
LANGUAGE SQL
AS $$
    SELECT COALESCE(SUM(amount), 0)
    FROM donations
    WHERE payment_status = 'COMPLETED';
$$;
