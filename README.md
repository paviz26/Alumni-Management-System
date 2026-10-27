# Alumni Management System

Browser-based alumni directory and engagement system. The repository currently uses a React/Vite client, a Python FastAPI REST API, SQLAlchemy ORM, and PostgreSQL through psycopg v3. The backend is FastAPI; the earlier Node/Express stack description was stale.

## Implemented architecture

- Frontend: React 19, Vite, React Router, and `fetch` through `frontend/src/utils/api.js`.
- Backend: Python 3.10+ with FastAPI, Pydantic, SQLAlchemy 2, Alembic, and psycopg v3.
- Database: PostgreSQL. The runtime ORM owns the application schema. SQL scripts in `database/` document and implement the database course artifacts; the Alembic migration installs the required runtime views, functions, and triggers.
- Authentication: bcrypt password hashes and signed HS256 bearer JWTs. Authenticated API calls send `Authorization: Bearer <token>`.
- Roles: `ADMIN`, `ALUMNI`, `STUDENT`, and `FACULTY`. Admin accounts are created from a trusted terminal; public signup accepts the other three roles, including FACULTY per the project policy.

## Repository map

```text
backend/app/              FastAPI app, models, schemas, routes, security
backend/alembic/          Versioned PostgreSQL migrations
backend/tests/            Isolated API tests and opt-in PostgreSQL race test
database/                 Schema reference, sample data, queries, views, functions, triggers, roles
docs/                     Project notes and feature specification
frontend/src/             React application (frontend changes are outside backend scope)
docker-compose.yml        Local PostgreSQL service
APIS.md                   Registered backend API reference
```

## Prerequisites

- Python 3.10 or newer.
- PostgreSQL 14 or newer (the compose file uses PostgreSQL 16).
- Node.js 16+ only when running the existing frontend.

Backend dependency pins and ranges are in `backend/requirements.txt` (including FastAPI 0.116.1, SQLAlchemy 2.0.36, psycopg 3.3.6, Pydantic 2.13.5, and Alembic 1.x).

## PostgreSQL setup

The compose file starts only PostgreSQL. Set a local password through your secret manager or shell prompt; the repository does not provide a database password:

```bash
read -rsp 'Local PostgreSQL password: ' POSTGRES_PASSWORD; export POSTGRES_PASSWORD
docker compose up -d postgres
```

The container creates the `alumni_management` database. For an independently installed PostgreSQL server, create that database with `createdb alumni_management` or run `database/00_create_database.sql` while connected to a different database.

Back up any existing database before applying the migration. The migration preserves SQL-era alumni mentorship rows in `mentorship_alumni_legacy`; if both job table variants exist, it retains old SQL `jobs` rows in `jobs_sql_legacy` and migrates the runtime postings table to canonical `jobs`. It stops when duplicate relationships or unresolved mentorship participants prevent safe constraints. It does not load sample data.

## Backend installation and configuration

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` only if a local environment file does not already exist. Replace both placeholders locally; do not commit the real file.

Required settings:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy URL, normally `postgresql+psycopg://alumni_app:<local-password>@localhost:5432/alumni_management` |
| `JWT_SECRET_KEY` | Unique random secret of at least 32 characters |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Positive token lifetime; default is 60 |
| `CORS_ALLOWED_ORIGINS` | Comma-separated browser origins; Vite defaults to port 3000 |

The expected PostgreSQL login is `alumni_app`. After creating the database, an administrator can run `database/07_roles_permissions.sql` to create/grant the project roles, then set role passwords interactively in `psql` with `\password alumni_app` (and as appropriate for the other roles). The app should not connect as PostgreSQL superuser. The SQL role script grants the app role table writes and the readonly role SELECT access; database roles do not replace application-role checks.

## Schema initialization and migrations

The API no longer mutates tables during import or startup. Apply the reviewed migration explicitly from `backend/`:

```bash
alembic upgrade head
```

The migration creates the canonical ORM tables on a clean database, performs additive/rename/archive steps for recognized legacy layouts, and installs the eight views, six functions, and three validation triggers from `database/04_views.sql` through `database/06_triggers.sql`. It does not execute `database/02_sample_data.sql`. Do not run the old standalone schema script on top of a migrated database.

To load the sample rows into a new, empty database only, run `database/02_sample_data.sql` after migration. The sample SQL is not idempotent. Its sample password strings are placeholders and are not usable login credentials.

Run the backend from `backend/` after migration:

```bash
uvicorn app.main:app --reload --port 5000
```

The health endpoint is `GET http://localhost:5000/api/health`. It reports API process health and does not expose credentials. It does not prove database availability.

## Administrator provisioning

Public registration cannot assign `ADMIN`. Use a trusted terminal with the backend environment configured:

```bash
python -m app.create_admin
```

The command prompts for an email and password, hashes the password, and refuses to overwrite an existing account.

## Run tests safely

```bash
cd backend
python -m pytest -q tests
```

The API test fixture forcibly uses a fresh in-memory SQLite database and does not inherit `DATABASE_URL`, so it cannot write to the development or production PostgreSQL database. The PostgreSQL concurrency test is skipped unless both `ALUMNI_TEST_DB_DISPOSABLE=1` and `ALUMNI_TEST_DATABASE_URL` are explicitly set to a disposable, migrated test database. Never point that variable at a normal or production database.

## Existing database features

Core entities include users, alumni, departments, companies, students, faculty, events, event registrations, jobs, job applications, mentorship, announcements, donations, achievements, connections, event invitations, and notifications. The SQL directory also contains 24 query examples, indexes, 8 reporting views, 6 functions, 3 triggers, transaction demonstrations, sample data, and database role grants.

The selected application mentorship relationship is student-to-alumni. Legacy alumni-to-alumni rows are archived during migration rather than discarded. Job listings use one `jobs` table, retain a free-text company name for compatibility, and keep an optional company foreign key for existing relational data. Profile company names remain free text.

Donation endpoints record pledges as `PENDING`, let an administrator mark them `COMPLETED` or `FAILED`, and report completed totals. No payment gateway or real payment settlement is included.

## Frontend

From another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite proxy forwards `/api` to `http://localhost:5000`. The backend returns canonical snake_case fields plus camelCase aliases and a `success` field for object responses to preserve the current React contract. Some frontend pages remain read-only or have controls that are not wired to backend operations; see `APIS.md` and the limitations below.

## Backup and restore

Create a custom-format backup before migration or other database changes:

```bash
pg_dump --format=custom --file=alumni_management.dump alumni_management
```

Restore to a newly created, empty database rather than overwriting a database with unknown contents:

```bash
createdb alumni_management_restore
pg_restore --no-owner --dbname=alumni_management_restore alumni_management.dump
```

Keep backups encrypted and outside the repository. Verify restores periodically before relying on them.

## Troubleshooting

- **Settings validation fails:** `DATABASE_URL` and a unique `JWT_SECRET_KEY` (32+ characters) are required. Confirm `backend/.env` exists and the command is run from `backend/`.
- **Database login fails:** confirm PostgreSQL is running, the database exists, and `alumni_app` has a password and the grants from `database/07_roles_permissions.sql`.
- **Missing relation/column:** run `alembic upgrade head`; startup intentionally does not repair schemas.
- **Vite returns API errors:** start the backend on port 5000 and ensure the frontend uses its configured `/api` proxy.
- **Migration stops on duplicate or incomplete mentorship rows:** back up the database and reconcile those rows explicitly before retrying; the migration will not discard or invent participant data.

## Known limitations and unverified behavior

- The local Python 3.14 / installed Starlette TestClient combination hangs even with a minimal FastAPI application. The test suite could not complete in that environment; use a supported Python/TestClient combination and run against the isolated SQLite fixture.
- No PostgreSQL server was available for applying migrations, validating SQL objects, checking grants, or executing the event race test. Those database behaviors are not reported as runtime-verified.
- Faculty self-registration is allowed by project policy and is not institutionally verified; provision this service only where that policy is acceptable.
- There is no payment gateway, email delivery, batch/cohort management, or full CRUD for departments/companies/users.
- The frontend does not expose donation management or every backend operation. It also currently offers no event update form.
- The SQL reference scripts and the Alembic ORM migration are aligned for the selected model, but only the migration path should be used for an existing database.
