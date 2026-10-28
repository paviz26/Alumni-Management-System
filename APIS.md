# Alumni Management API

This reference describes the registered FastAPI routes in `backend/app/main.py` and `backend/app/routers/`. Interactive OpenAPI is available at `/docs` while the backend is running; machine-readable schema is `/openapi.json`.

Base URL for local development: `http://localhost:5000/api`.

## Shared API rules

- **Bearer authentication:** send `Authorization: Bearer <JWT>` to protected endpoints. Tokens are issued by `POST /auth/login` and expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60). There is no token revocation/logout endpoint; clients discard the token on logout.
- **Roles:** `ADMIN`, `ALUMNI`, `STUDENT`, `FACULTY`. `ADMIN` cannot be selected at public registration. Public faculty registration is currently enabled per project policy.
- **Response field names:** JSON retains backend snake_case keys and adds camelCase aliases for existing React consumers. Object responses also include `success: true` when absent. Array responses remain arrays; their item fields receive both naming styles.
- **Error response:** `{"success": false, "message": "...", "detail": ...}`. FastAPI validation errors use HTTP 422 and include the Pydantic error list in `detail`. Typical statuses are 401 unauthenticated/invalid token, 403 authenticated but forbidden, 404 missing or inaccessible resource, 409 conflict/invalid state, and 422 invalid input.
- **Dates:** send ISO 8601 timestamps for event dates and ISO `YYYY-MM-DD` for dates/deadlines. Event timestamps with offsets are normalized to UTC before persistence.
- **No secrets in responses:** password hashes and JWT signing material are never returned.

## Root

| Method and path | Access | Request | Response |
|---|---|---|---|
| `GET /` | Public | None | `{"message":"Alumni Management API"}` |

## Health

| Method and path | Access | Request | Success response | Notes |
|---|---|---|---|---|
| `GET /health` | Public | None | `{"status":"ok","message":"Alumni Management API is running","success":true}` | Process health only; it does not test PostgreSQL. |

## Authentication

| Method and path | Access | Request | Success response / side effects |
|---|---|---|---|
| `POST /auth/register` | Public; roles STUDENT, ALUMNI, FACULTY only | JSON `firstName`, `lastName`, `email`, `password`, `role`; optional `department`. STUDENT also requires `registrationNumber`; ALUMNI requires `graduationYear` (1950 through current year + 10), `company`, `jobTitle`; FACULTY requires `designation`. Password is 6+ characters and at most 72 UTF-8 bytes. | 201 `AuthResponse` with `success`, `message`, `user` (`userId`, `email`, `role`, `firstName`, `lastName`, `verified`) and null `token`. User and role profile are committed atomically. Email and registration number are unique. ADMIN input is rejected with 422. Duplicate email or registration number returns 409. |
| `POST /auth/login` | Public | JSON `email`, `password` (6–72 UTF-8 bytes) | 200 with `success`, `message`, `user`, and signed `token`. Invalid credentials return 401. |

Example:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alumni@example.edu","password":"a-long-local-password"}'
```

## Alumni and profiles

| Method and path | Access / ownership | Request | Response / database effect |
|---|---|---|---|
| `GET /alumni` | Any authenticated role | Query `page` (default 1, >=1), `limit` (default 10, 1–100) | Paginated object: `alumni`, `currentPage`, `totalPages`, `totalItems`. Directory rows omit email and verification internals. |
| `GET /alumni/search` | Any authenticated role | Query optional `keyword`, `department`, `graduationYear`, `field`, `company`, `location`, `page`, `limit` | Same pagination shape as directory. Search uses case-insensitive partial matching for keyword/field/company/location; department accepts code or name. |
| `GET /alumni/suggested` | Any authenticated role | None | Up to ten alumni rows, excluding the caller. |
| `GET /alumni/available-mentors` | Any authenticated role | None | Alumni profile list for mentorship discovery. |
| `GET /alumni/stats` | ALUMNI account with profile | None | `connections`, `mentorshipRequests`, `alumniId`; counts accepted connections and pending incoming mentorship requests. |
| `GET /alumni/achievements` | ALUMNI account with profile | None | Current user's achievement array. |
| `POST /alumni/achievements` | ALUMNI | JSON `title` (non-empty), optional `description`, optional `achievementDate` | 201 created achievement with `achievementId`, title, description, date. Creates an achievement owned by the caller. |
| `PUT /alumni/achievements/{achievement_id}` | Owner ALUMNI or ADMIN | Same fields as create | Updates title, description, date. Other users receive 403. |
| `DELETE /alumni/achievements/{achievement_id}` | Owner ALUMNI or ADMIN | None | Deletes the achievement; returns success/message. |
| `GET /alumni/me` | Any authenticated role; caller must have alumni profile | None | Own profile and achievements, including own email. Non-alumni accounts receive 404. |
| `PUT /alumni/me` | ALUMNI profile owner | Optional JSON fields `firstName`, `lastName`, `phone`, `company`, `jobTitle`, `location`, `bio`, `linkedinUrl`, `githubUrl` | Updates only the supplied profile fields and matching user names. Role, email, and verification state cannot be changed through this endpoint. |
| `GET /alumni/{alumni_id}` | Any authenticated role | Path `alumni_id` | Profile and achievements without email. Missing profile returns 404. |

Profile values contain alumni/user ids, names, phone, department code/name, graduation year, company, designation, location, bio, profile URLs, and verification fields. Company names remain free text. Directory and profile read access is currently available to every authenticated role; email is omitted except on `/alumni/me`.

## Connections

| Method and path | Access / ownership | Request | Response / side effects |
|---|---|---|---|
| `POST /connections/request` | Any authenticated user; target must be another alumni | JSON `alumni_id` > 0 | 201 `success`, message, `connection_id`; creates pending request and recipient notification in one transaction. Duplicate or reverse request returns 409; self request returns 400. |
| `GET /connections` | Authenticated; caller's sent and received rows only | None | Array of connection ids, sender/receiver ids, status, requested/accepted timestamps. |
| `GET /connections/requests` | Authenticated; incoming pending rows only | None | Array with requester name/title/department/year and request time. |
| `GET /connections/my-connections` | Authenticated; accepted rows involving caller only | None | Array of peer identity/title/department/year and connection time. |
| `GET /connections/sent-requests` | Authenticated; caller's pending sent requests only | None | Array of recipient and request details. |
| `PUT /connections/{connection_id}` | Request receiver or ADMIN; request must be PENDING | JSON `status`: `ACCEPTED` or `REJECTED` | Updates status and accepted timestamp; creates sender notification transactionally. Other callers receive 403; already answered request returns 409. |
| `DELETE /connections/{connection_id}` | Sender or ADMIN | None | Deletes/cancels request or connection; returns success/message. |

## Mentorship

The active model is **student-to-alumni**. Legacy alumni-to-alumni records are preserved in `mentorship_alumni_legacy` by the migration.

| Method and path | Access / ownership | Request | Response / side effects |
|---|---|---|---|
| `POST /mentorship` | STUDENT | JSON `mentor_id`, `area_of_interest` (1–100 chars), `message` (non-empty) | 201 mentorship id/status/mentor id; creates PENDING request and alumni notification atomically. Duplicate pair returns 409. |
| `GET /mentorship/my-requests` | STUDENT; caller's own requests | None | Array of mentor, interest, message, status, and request timestamp. Other roles receive an empty array. |
| `GET /mentorship/requests` | ALUMNI; requests assigned to caller | None | Array of student names, interest, message, status, timestamp. Other roles receive an empty array. |
| `GET /mentorship/active` | STUDENT sees own requests; ALUMNI sees requests assigned to them | None | Array of PENDING/ACCEPTED mentorships. Other roles receive an empty array. |
| `GET /mentorship/overview` | Authenticated; STUDENT/ALUMNI own scope, FACULTY department scope | None | Counts `active`, `completed`, `pending`. Faculty with no department gets zeros; ADMIN currently gets zeros. |
| `PUT /mentorship/{mentorship_id}` | Assigned alumni or ADMIN | JSON `status`: `ACCEPTED`, `REJECTED`, or `COMPLETED` | Updates status and notifies the student in the same transaction. Normal transitions: PENDING→ACCEPTED/REJECTED, ACCEPTED→COMPLETED. Invalid transition returns 409. |
| `DELETE /mentorship/{mentorship_id}` | Student participant, assigned alumni, or ADMIN | None | Deletes/cancels the mentorship request. |

## Events

Pending events are visible to their creator (FACULTY) and ADMIN; other authenticated users see approved events only. Only ALUMNI profiles can register.

| Method and path | Access / ownership | Request | Response / side effects |
|---|---|---|---|
| `GET /events` | Authenticated; visibility scoped as above | None | Event array with event id/title/date/venue/capacity/type/status, registration count, `isRegistered`, and caller-relative `isCreator` for owner-aware controls. |
| `GET /events/upcoming` | Authenticated; visibility scoped | None | Upcoming event array. |
| `GET /events/past` | Authenticated; visibility scoped | None | Past event array with registration/attendance count. |
| `GET /events/recent` | Authenticated; visibility scoped | None | Up to five events. |
| `GET /events/my-registrations` | Authenticated ALUMNI; caller's registrations | None | Registration/event details; other roles receive an empty array. |
| `POST /events` | FACULTY or ADMIN | JSON required `title`, `eventDate`; optional `description`, `venue`, `capacity` (>0 if present), `type` | 201 event id/title/status. Created by caller with PENDING status; past dates return 400. |
| `PUT /events/{event_id}` | Creating FACULTY account or ADMIN | Any subset of title, description, `eventDate`, venue, capacity, type | Updates event. Capacity cannot be reduced below current registrations (409). Event status cannot be changed here. |
| `POST /events/{event_id}/register` | ALUMNI with profile; event must be APPROVED | Empty body | 201 registration id/event id/status; capacity lock/check, duplicate guard, and notification are in one transaction. Full or duplicate returns 409. |
| `POST /events/{event_id}/invite` | FACULTY or ADMIN | JSON `userId` > 0 | 200 invite id; creates invitation and notification in one transaction. Duplicate returns 409; unknown target returns 404. There is no invitation response endpoint yet. |
| `DELETE /events/{event_id}` | Event creator FACULTY or ADMIN | None | Deletes event and cascaded registrations/invites. |
| `DELETE /events/registrations/{registration_id}` | Registrant ALUMNI or ADMIN | None | Cancels registration by deletion, reducing the current count; returns success/message. |

## Jobs and applications

Canonical runtime table: `jobs`. Company text is stored in `company`; optional `company_id` is retained for existing relational records. External application URLs are links; no external application form is hosted by this API.

| Method and path | Access / ownership | Request | Response / side effects |
|---|---|---|---|
| `GET /jobs` | Authenticated | None | Job array with title/company/location/type/deadline/description/application URL/poster/`hasApplied`/application count. |
| `GET /jobs/recent` | Authenticated | None | Up to five recent job summaries. |
| `GET /jobs/my-applications` | Authenticated STUDENT; caller's rows | None | Application array; other roles receive an empty array. |
| `GET /jobs/my-postings` | Authenticated ALUMNI; caller's rows | None | Caller-owned postings and application counts; other roles receive an empty array. |
| `POST /jobs` | ALUMNI or ADMIN | JSON required `title`; optional description, company, location, `employmentType`, deadline (`YYYY-MM-DD`), `applicationUrl` (absolute HTTP/S URL) | 201 job id/title/status. Alumni posting is linked to caller. Past deadlines return 422. |
| `PUT /jobs/{job_id}` | Posting ALUMNI or ADMIN | Same fields as create; title required | Updates posting; unauthorized owner returns 403; past deadline returns 422. |
| `POST /jobs/{job_id}/apply` | STUDENT | Empty body | 201 application id/job id/status and notification in same transaction. Duplicate returns 409; expired posting returns 400. This records an application in the system; external URL is separately supplied for the outside application process. |
| `DELETE /jobs/{job_id}` | Posting ALUMNI or ADMIN | None | Deletes posting and cascades applications. |

## Announcements

| Method and path | Access / ownership | Request | Response / side effects |
|---|---|---|---|
| `GET /announcements` | Authenticated; ADMIN/FACULTY see all, others published only | None | Array of announcement id/title/content/created timestamp/status and caller-relative `isCreator` for owner-aware controls. |
| `GET /announcements/recent` | Authenticated; published only | None | Up to five published announcements. |
| `POST /announcements` | FACULTY or ADMIN | JSON `title`, `content` (non-empty) | 201 id/title/status; creator is caller, status PUBLISHED. |
| `PUT /announcements/{announcement_id}` | Creator FACULTY or ADMIN | JSON `title`, `content` | Updates announcement. Other roles receive 403. |
| `DELETE /announcements/{announcement_id}` | Creator FACULTY or ADMIN | None | Deletes announcement. |

## Notifications

All routes are authenticated and scoped to the current user's `user_id`.

| Method and path | Request | Response / effects |
|---|---|---|
| `GET /notifications` | None | Array of notification id/message/type/read/created timestamp. |
| `PUT /notifications/{notification_id}/read` | None | Marks only the caller's notification read; another user's or missing id returns 404. |
| `PUT /notifications/mark-all-read` | None | Marks all caller-owned unread rows read and reports the count. |

These are in-app database notification records. They are not email or push delivery.

## Administration

Every route requires ADMIN. Admin accounts are provisioned with `python -m app.create_admin`.

| Method and path | Request | Response / effects |
|---|---|---|
| `GET /admin/statistics` | None | Counts users by role, events, and mentorship records. |
| `GET /admin/pending-verifications` | None | Alumni verification queue. |
| `GET /admin/alumni-verification` | Optional query `status` (`PENDING`, `VERIFIED`, `REJECTED`) | Alumni verification rows. |
| `GET /admin/pending-events` | None | Pending event rows with creator display name. |
| `GET /admin/recent-activity` | None | Ten most recent notification records. |
| `PUT /admin/verify-alumni/{alumni_id}` | None | Sets verification status VERIFIED and boolean true. |
| `PUT /admin/reject-alumni/{alumni_id}` | Optional JSON `reason` | Sets verification REJECTED/false. The current schema does not persist the reason. |
| `PUT /admin/approve-event/{event_id}` | None | Sets event status APPROVED. |

There is no broad user, department, or company CRUD API in the selected backend scope.

## Faculty

All faculty routes require the FACULTY role and scope data to the caller's department.

| Method and path | Request | Response |
|---|---|---|
| `GET /faculty/department-stats` | None | Counts students and alumni in caller's department. |
| `GET /faculty/stats` | None | Same department-scoped counts. |
| `GET /faculty/students` | None | Student names, registration numbers, and department code for caller's department. |
| `GET /faculty/alumni` | None | Alumni directory fields for caller's department. |

## Database reports and functions

All report routes require ADMIN. View endpoints accept `limit` (default 100, range 1–500) and `offset` (default 0, non-negative). They query the corresponding PostgreSQL view installed by Alembic.

| Method and path | Inputs | Result |
|---|---|---|
| `GET /reports/alumni-directory` | `limit`, `offset` | Rows from `alumni_directory`. |
| `GET /reports/event-participation` | `limit`, `offset` | Rows from `event_participation`. |
| `GET /reports/alumni-career` | `limit`, `offset` | Rows from `alumni_career`. |
| `GET /reports/job-opportunities` | `limit`, `offset` | Rows from `job_opportunities`. |
| `GET /reports/mentorship-directory` | `limit`, `offset` | Rows from `mentorship_directory` (student to alumni). |
| `GET /reports/donation-summary` | `limit`, `offset` | Rows from `donation_summary`. |
| `GET /reports/alumni-event-history` | `limit`, `offset` | Rows from `alumni_event_history`. |
| `GET /reports/department-alumni-summary` | `limit`, `offset` | Rows from `department_alumni_summary`. |
| `GET /reports/functions/alumni-count?department_id={id}` | Required positive `department_id` | `{"departmentId": id, "count": n}` via `get_alumni_count_by_department`. |
| `GET /reports/functions/completed-donations-total` | None | `{"total": decimal}` via `get_total_completed_donations`. |
| `GET /reports/functions/event-registration-count?event_id={id}` | Required positive `event_id` | Event id/count via `get_event_registration_count`. |
| `GET /reports/functions/alumni-donation-total?alumni_id={id}` | Required positive `alumni_id` | Alumni id/completed donation total via `get_alumni_donation_total`. |
| `GET /reports/functions/alumni-name?alumni_id={id}` | Required positive `alumni_id` | Alumni id/name; name is null for unknown id, via `get_alumni_name`. |
| `GET /reports/functions/jobs-posted-count?alumni_id={id}` | Required positive `alumni_id` | Alumni id/count via `get_jobs_posted_by_alumni`. |

View endpoints return arrays and use SQL parameter binding for pagination. Function endpoints return one JSON object. Missing database views/functions cause a database error; apply `alembic upgrade head` before using report routes. These endpoints are implemented for admin reporting and DBMS feature access; the React client does not currently call them.

## Donations

Donation endpoints implement recordkeeping only; no payment gateway is configured. All routes require authentication plus the stated role.

| Method and path | Access / ownership | Request | Response / effects |
|---|---|---|---|
| `POST /donations` | ALUMNI | JSON `amount` positive decimal (up to 12 digits, 2 decimal places), optional `purpose` (max 200 chars) | 201 donation record with status PENDING, associated to caller. |
| `GET /donations/me` | ALUMNI | None | Caller-owned donation history. |
| `GET /donations` | ADMIN | None | All donation records. |
| `GET /donations/summary` | ADMIN | None | Completed donation total and count. |
| `PUT /donations/{donation_id}/status` | ADMIN | JSON `payment_status`: `COMPLETED` or `FAILED` | Finalizes a PENDING record once. Re-finalization returns 409. This status is administrative recordkeeping and does not confirm a bank/payment-gateway transaction. |

## Frontend contract notes

The React client uses compatibility aliases for camelCase fields while the API retains canonical snake_case fields. It now includes directory search/paging, alumni profile editing, event management/approval/registration, job posting management, role-specific mentorship, announcement editing, and donation recordkeeping. Event invitations still have no list/response workflow, and donations have no payment gateway.
