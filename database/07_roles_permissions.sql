-- ============================================================
-- ALUMNI MANAGEMENT SYSTEM
-- DATABASE ROLES AND PERMISSIONS
-- ============================================================

-- Run this file as PostgreSQL administrator (postgres).


-- ============================================================
-- 1. CREATE APPLICATION DATABASE ROLES
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT FROM pg_roles
        WHERE rolname = 'alumni_admin'
    ) THEN
        CREATE ROLE alumni_admin LOGIN PASSWORD 'change_me_admin';
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_roles
        WHERE rolname = 'alumni_app'
    ) THEN
        CREATE ROLE alumni_app LOGIN PASSWORD 'change_me_app';
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_roles
        WHERE rolname = 'alumni_readonly'
    ) THEN
        CREATE ROLE alumni_readonly LOGIN PASSWORD 'change_me_readonly';
    END IF;

END
$$;


-- ============================================================
-- 2. DATABASE CONNECTION PERMISSIONS
-- ============================================================

GRANT CONNECT
ON DATABASE alumni_management
TO alumni_admin, alumni_app, alumni_readonly;


-- ============================================================
-- 3. SCHEMA PERMISSIONS
-- ============================================================

GRANT USAGE
ON SCHEMA public
TO alumni_admin, alumni_app, alumni_readonly;


-- ============================================================
-- 4. ADMIN ROLE
-- Full access to project tables
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO alumni_admin;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO alumni_admin;


-- ============================================================
-- 5. APPLICATION ROLE
-- Used by backend application
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO alumni_app;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO alumni_app;


-- ============================================================
-- 6. READ-ONLY ROLE
-- Suitable for users/services that only need to view data
-- ============================================================

GRANT SELECT
ON ALL TABLES IN SCHEMA public
TO alumni_readonly;


-- ============================================================
-- 7. FUNCTION PERMISSIONS
-- Allow application roles to execute project functions
-- ============================================================

GRANT EXECUTE
ON ALL FUNCTIONS IN SCHEMA public
TO alumni_admin, alumni_app, alumni_readonly;


-- ============================================================
-- 8. FUTURE OBJECT DEFAULTS
-- Automatically grant permissions on newly created tables
-- ============================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLES
TO alumni_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT
ON TABLES
TO alumni_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT
ON SEQUENCES
TO alumni_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE
ON FUNCTIONS
TO alumni_app, alumni_readonly;