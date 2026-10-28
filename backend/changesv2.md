# Backend Changes v2 and Frontend Follow-up

This note records the backend work and the React follow-up initially expected. The frontend follow-up is now implemented; see the status section at the end for the current result.

## Backend changes made

### Startup and configuration

- Settings require `DATABASE_URL` and a unique `JWT_SECRET_KEY` (minimum 32 characters); JWT algorithm and expiry are validated.
- `backend/app/core/config.py` resolves `backend/.env` relative to the config file, so Uvicorn can load it when launched from either the repository root or `backend/`.
- Application import/startup no longer calls `create_all()` or compatibility DDL. Schema setup is an explicit Alembic operation.
- `backend/app/db/database.py` rolls back a request session when an exception escapes the database dependency.
- Root `/` and `/api/health` are public process-health endpoints. Health does not check PostgreSQL connectivity.

### Authentication and authorization

- Registration validates role-specific fields before writes and commits the user and student/alumni/faculty profile together. Failed writes roll back. Duplicate email and registration number conflicts return 409.
- Public registration supports `STUDENT`, `ALUMNI`, and `FACULTY`; `ADMIN` is rejected. Admin accounts are provisioned by `python -m app.create_admin`.
- Passwords remain hashed; login returns a JWT. JWT settings are not embedded in source code.
- Server-side role/ownership checks were added or tightened across faculty, alumni, mentorship, events, jobs, announcements, notifications, donations, and admin/report endpoints.
- Alumni directory/profile serialization omits other people's email and phone; the current user's own alumni profile includes their private contact values.
- API errors use a common JSON envelope (`success: false`, `message`, `detail`). Existing response keys are kept and camelCase aliases are added for React compatibility.

### Data model and database

- `JobPosting` now maps to the canonical SQL table `jobs`. Its runtime fields map to SQL columns `title`, `employment_type`, and `application_url`. Free-text job/company names remain supported; `company_id` remains optional.
- Runtime mentorship is student-to-alumni. Legacy alumni-to-alumni mentorship rows are retained in `mentorship_alumni_legacy` by the forward migration rather than converted or deleted.
- Added/aligned ORM constraints for roles, event registration uniqueness/status, mentorship participants/status, job applications, connections, invitations, and donations.
- Added a `Donation` ORM model and positive amount/payment-status constraints.
- Added a PostgreSQL migration under `backend/alembic/versions/`. It preserves recognized legacy job records in `jobs_sql_legacy` when both job table variants exist, builds missing ORM tables, applies compatible additive/rename steps, and installs the SQL views, functions, and triggers. It has no automatic destructive downgrade.
- The event capacity trigger locks its event row before counting registrations. The API also locks the event row while registering. Registration cancellation deletes the registration, releasing capacity.
- `database/07_roles_permissions.sql` no longer contains sample passwords. Role passwords must be set separately by the database operator.

### Backend endpoints and workflows

- Events: approval remains admin-only; event creation is faculty/admin; creator/admin updates; alumni registration; cancellation; invitations create both an invite row and notification.
- Mentorship: students request a mentor; only the assigned alumni or admin can change status; supported transitions are pending to accepted/rejected, then accepted to completed. Participant-scoped listing and deletion are enforced.
- Jobs: alumni/admin create, posting owner/admin update or delete, and students apply once per job. Application and notification writes share a transaction. External application URLs are validated as absolute HTTP(S) URLs.
- Announcements: faculty/admin create; creator faculty/admin update or delete; public-role listings only include published rows.
- Notifications: listing and read updates are scoped to the authenticated user.
- Donations: alumni can record a pending pledge and view their history; admins can list records, update a pending record to completed/failed, and view totals. This is recordkeeping only; there is no payment gateway.
- Reports: admin-only endpoints query the eight SQL views and six SQL functions.
- `backend/app/routers/admin.py` retains the selected core administration scope: alumni verification and event approval/statistics. General user, department, and company CRUD was not added.

## Frontend follow-up originally expected

The checklist below captures the original handoff and describes the state before implementation. It is retained for scope/history; use the implementation status at the end of this file for current behavior.

The response compatibility layer adds camelCase aliases to backend responses, so the React components do not need a wholesale snake_case-to-camelCase conversion. The checklist addresses role mismatches, missing UI, and response/error handling.

### Must fix existing actions that the backend now rejects

1. **Student event registration** — `frontend/src/pages/StudentDashboard.jsx`
   - It currently renders a Register button and calls `POST /events/{eventId}/register` for student accounts.
   - The backend permits registration only for alumni accounts with an alumni profile. Remove that button/action for students. Keep showing upcoming events as read-only, or link to event details.
   - `frontend/src/pages/EventsPage.jsx` is shared across roles and also always renders Register. Render it only for `currentUser.role === 'ALUMNI'`.
   - For alumni, use `event.isRegistered`, `event.registrationCount`, and nullable `event.capacity` to show the registered state and disable registration when full. Do not treat `capacity: null` as full.
   - Add an alumni “My registrations” section using `GET /events/my-registrations`, with cancellation using `DELETE /events/registrations/{registrationId}`. Refresh event and registration data after success.

2. **Mentorship role controls** — `frontend/src/pages/MentorshipPage.jsx`
   - The Available Mentors area currently appears to alumni as well as students. Show mentor discovery and the request action only to STUDENT; `POST /mentorship` returns 403 for other roles.
   - Alumni should see their incoming requests, accept/reject pending requests, and complete accepted relationships. The current component already has those controls; keep them restricted to ALUMNI because `GET /mentorship/requests` returns an empty list for other roles.
   - Faculty currently loads `/mentorship/requests` and `/mentorship/active`, which are participant-scoped and return empty results for faculty. Skip those calls for faculty and use `GET /mentorship/overview` for department-level totals, or leave detailed faculty mentorship browsing out of the UI.
   - Only students should see their request list and request cancellation control if added. `DELETE /mentorship/{id}` permits the student participant, assigned alumni, or admin.

### Add frontend controls for backend functionality

3. **Editable own profile** — `frontend/src/pages/ProfilePage.jsx`
   - The page currently only displays `GET /alumni/me`. Add an edit mode and submit only editable fields to `PUT /alumni/me`: `firstName`, `lastName`, `phone`, `company`, `jobTitle`, `location`, `bio`, `linkedinUrl`, `githubUrl`.
   - Do not send role, email, or verification fields. The endpoint is for an account with an alumni profile; handle a 404 for student/faculty/admin accounts with an explanatory message or hide the alumni-only profile page for those roles.
   - Reload `/alumni/me` after a successful save.

4. **Directory search and paging** — `frontend/src/pages/DirectoryPage.jsx` (and the search control in `StudentDashboard.jsx`)
   - The search input/button is currently not wired. Call `GET /alumni/search` with URL-encoded `keyword` and optional `department`, `graduationYear`, `field`, `company`, `location`, plus `page` and `limit`.
   - Treat the response as `{alumni, currentPage, totalPages, totalItems}`; the backend currently returns a paginated object, not a top-level array.
   - Add paging controls or clearly label the current first-page-only behavior. Do not display email/phone from directory results; the backend omits them by design.
   - Department filtering accepts department code or name.

5. **Job posting management and external links** — `frontend/src/pages/JobsPage.jsx`
   - Current UI lists jobs, student applications, and alumni postings but has no create/edit/delete controls. Add an alumni posting form using `POST /jobs`, with `title`, optional `description`, `company`, `location`, `employmentType`, `deadline` (`YYYY-MM-DD`), and `applicationUrl` (absolute `http://` or `https://`).
   - Add edit and delete controls for the poster's own rows using `PUT /jobs/{jobId}` and `DELETE /jobs/{jobId}`. Admin can use the same endpoints if an admin jobs screen is added.
   - Display `applicationUrl` as a safe external link (`target="_blank"`, `rel="noopener noreferrer"`). The API also tracks an in-app student application through `POST /jobs/{jobId}/apply`; make the UI clear whether the button records an application, opens the external URL, or does both.
   - Hide/disable Apply for non-students, expired deadlines, or already-applied rows. Backend duplicate submissions return 409.

6. **Event management and approval** — `frontend/src/pages/EventsPage.jsx`, `frontend/src/pages/AdminVerificationPage.jsx`, and role navigation in `frontend/src/components/Sidebar.jsx`
   - There is no event creation/edit UI. Add a faculty/admin form using `POST /events`; new events are `PENDING` and not visible to students/alumni until approved.
   - Add creator/admin edit/delete controls using `PUT /events/{eventId}` and `DELETE /events/{eventId}`. The server checks ownership; faculty can update only their own events.
   - Add an admin pending-event queue using `GET /admin/pending-events` and approval using `PUT /admin/approve-event/{eventId}`. The existing admin verification page currently handles alumni only.
   - Event invitations can be created with `POST /events/{eventId}/invite`, but there is no invitation list/response API. Do not present invitations as a complete RSVP workflow.

7. **Announcement editing and creator display** — `frontend/src/pages/AnnouncementsPage.jsx`
   - The page supports listing and creation but not update/delete. Add controls for the creator faculty member and admin using `PUT /announcements/{announcementId}` and `DELETE /announcements/{announcementId}`.
   - The current list response does not include a creator user id, although the component displays `createdBy`. That field is therefore not populated by this backend response. Before ownership-aware controls can be hidden/shown correctly, the backend should add a `created_by`/`createdBy` field to list rows, or the UI should omit author display. Regardless of UI visibility, the server remains the authority and may return 403 for a non-creator faculty member.
   - Existing notifications are in-app records only; do not label them as email delivery.

8. **Donation pages and navigation** — new frontend page plus `frontend/src/App.jsx` and `frontend/src/components/Sidebar.jsx`
   - There is no donation page or navigation entry. Add alumni donation record form/history: `POST /donations` with positive decimal `amount` and optional `purpose`; `GET /donations/me` for history.
   - Add an admin donation view using `GET /donations`, `GET /donations/summary`, and `PUT /donations/{donationId}/status` with `COMPLETED` or `FAILED`.
   - Label these as donation records/pledges. A completed status is an administrative record state, not a confirmed payment. Do not add a “Pay” flow unless a payment provider is separately selected and integrated.

### Admin verification and registration details

9. **Rejection reason display** — `frontend/src/pages/AdminVerificationPage.jsx`
   - It prompts for a rejection reason and sends `{reason}`, but the backend currently does not persist or return that reason. Remove the prompt/claim that it is recorded, or add reason persistence to the backend before presenting it as an audit record. Verification/rejection itself is supported.

10. **Registration alignment** — `frontend/src/pages/RegisterPage.jsx`
    - The page already submits the role-specific keys expected by registration and offers STUDENT, ALUMNI, and FACULTY; do not add ADMIN to public signup.
    - Add a client-side password maximum of 72 UTF-8 bytes (backend validation limit), and align graduation-year maximum with the current year plus 10 instead of a fixed 2100.
    - Department selector options currently submit short values such as `CSE`, while registration lookup matches department names and creates a department if no exact name matches. To avoid accidental duplicate departments, submit the canonical department name as the option value, or change the backend lookup to resolve codes before adding more department options. The present backend may create a separate department row for a code that does not match an existing name.
    - Keep faculty signup visible only if the project continues to allow public faculty registration; otherwise faculty provisioning policy must be changed server-side as well.

11. **Common HTTP error handling** — `frontend/src/utils/api.js`
    - The helper currently parses JSON without checking `response.ok`. Add shared status handling: parse the backend error envelope, preserve `response.status`, and expose `message`/validation `detail` to pages.
    - Keep the existing 401 token-clearing/redirect behavior. For 403 show a permission message; for 404 show unavailable/not found; for 409 show duplicate/full/state conflict; for 422 display field validation details. Avoid showing “Network error” for an HTTP response the server successfully returned.
    - Keep sending `Authorization: Bearer <token>` for protected routes and JSON content type for JSON writes.

### Pages that need no immediate payload rename

The login/registration forms, dashboards, events, jobs, mentorship, connection, notification, and admin verification components use camelCase response properties. Backend responses currently include those aliases, so they do not need an immediate field-by-field rename. New code should use the documented API response types consistently; a later cleanup can standardize the frontend on camelCase or snake_case rather than depending indefinitely on dual fields.

`FacultyDashboard.jsx`, `AlumniDashboard.jsx`, and `AdminDashboard.jsx` already call their core dashboard endpoints. Keep their role-specific data loading, and show empty/zero states where the caller has no department or relevant profile.

## Verification status and limitations

- `npm run build` succeeds for the frontend. End-to-end role workflows still require a configured API/database and corresponding test accounts.
- Python syntax parsing, ORM metadata creation in in-memory SQLite, FastAPI route registration, and OpenAPI generation were previously verified.
- The API test run did not complete in the local Python 3.14 / Starlette TestClient environment. PostgreSQL migrations, SQL views/functions/triggers, grants, and event concurrency were not runtime-verified because no disposable PostgreSQL instance was available.
- Frontend follow-up status: implemented. Directory filtering/pagination, alumni profile editing, role-aware event registration and management, event approval controls, job posting management, role-specific mentorship, announcement editing, donation pledge records, registration validation, and common HTTP error handling are now present in the React client.
- The frontend deliberately does not implement a payment flow or a complete event invitation/RSVP flow. Creator-only controls use caller-relative `isCreator` flags from the events and announcements list APIs; the backend continues to enforce ownership.
