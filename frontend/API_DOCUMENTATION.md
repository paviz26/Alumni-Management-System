# Alumni Management System - Frontend API Documentation

This document provides comprehensive details about the API endpoints that the frontend expects from the backend, including URLs, HTTP methods, request/response formats, authentication behavior, and error handling.

## Base URL
```
http://localhost:5000/api
```

## Authentication

### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "STUDENT", // or "ALUMNI", "FACULTY"
  "department": "CSE",
  // Role-specific fields:
  // For STUDENT:
  "registrationNumber": "REG123456",
  // For ALUMNI:
  "graduationYear": 2022,
  "company": "Microsoft",
  "jobTitle": "Software Engineer",
  "location": "Bengaluru",
  // For FACULTY:
  "designation": "Professor"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "userId": 1,
    "email": "john.doe@example.com",
    "role": "STUDENT",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### POST /api/auth/login
Authenticate user and return token.

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "john.doe@example.com",
    "role": "STUDENT",
    "firstName": "John",
    "lastName": "Doe",
    "verified": false
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Alumni Endpoints

### GET /api/alumni
Get all alumni with pagination.

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "alumni": [
    {
      "alumniId": 1,
      "userId": 2,
      "firstName": "Rahul",
      "lastName": "Sharma",
      "email": "rahul@example.com",
      "departmentCode": "CSE",
      "graduationYear": 2022,
      "companyName": "Microsoft",
      "designation": "Software Engineer",
      "location": "Bengaluru",
      "verified": true,
      "bio": "AI/ML engineer interested in healthcare AI."
    }
  ],
  "currentPage": 1,
  "totalPages": 5,
  "totalItems": 50
}
```

### GET /api/alumni/search
Search alumni with filters.

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `keyword` (optional): Search by name, company, or skills
- `department` (optional): Filter by department code
- `graduationYear` (optional): Filter by graduation year
- `field` (optional): Filter by professional field
- `company` (optional): Filter by company name
- `location` (optional): Filter by location
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "alumni": [
    {
      "alumniId": 1,
      "firstName": "Rahul",
      "lastName": "Sharma",
      "departmentCode": "CSE",
      "graduationYear": 2022,
      "companyName": "Microsoft",
      "designation": "Software Engineer",
      "location": "Bengaluru",
      "verified": true
    }
  ],
  "currentPage": 1,
  "totalPages": 2,
  "totalItems": 15
}
```

### GET /api/alumni/:id
Get specific alumni profile.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "alumniId": 1,
  "userId": 2,
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul@example.com",
  "phone": "+91 9876543210",
  "departmentCode": "CSE",
  "graduationYear": 2022,
  "companyName": "Microsoft",
  "designation": "Software Engineer",
  "location": "Bengaluru",
  "bio": "AI/ML engineer interested in healthcare AI.",
  "linkedinUrl": "https://linkedin.com/in/rahul",
  "githubUrl": "https://github.com/rahul",
  "verified": true,
  "achievements": [
    {
      "achievementId": 1,
      "title": "AI Innovation Award",
      "description": "Developed an AI healthcare solution",
      "achievementDate": "2026-09-20"
    }
  ]
}
```

### GET /api/alumni/me
Get current user's alumni profile.

**Authentication:** Required (Bearer Token)

**Response:** Same as GET /api/alumni/:id

### PUT /api/alumni/me
Update current user's alumni profile.

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "phone": "+91 9876543210",
  "company": "Microsoft",
  "jobTitle": "Senior Software Engineer",
  "location": "Bengaluru",
  "bio": "Updated bio information",
  "linkedinUrl": "https://linkedin.com/in/rahul-updated",
  "githubUrl": "https://github.com/rahul-updated"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "alumni": { /* updated alumni object */ }
}
```

### GET /api/alumni/suggested
Get suggested alumni for connections.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "alumni": [
    {
      "alumniId": 2,
      "firstName": "Ananya",
      "lastName": "Rao",
      "designation": "Data Scientist",
      "companyName": "AWS",
      "departmentCode": "AI",
      "graduationYear": 2021
    }
  ]
}
```

### GET /api/alumni/available-mentors
Get alumni available for mentorship.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "mentors": [
    {
      "alumniId": 1,
      "firstName": "Rahul",
      "lastName": "Sharma",
      "designation": "Software Engineer",
      "companyName": "Microsoft"
    }
  ]
}
```

### GET /api/alumni/stats
Get alumni statistics for dashboard.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "connections": 25,
  "mentorshipRequests": 3
}
```

### GET /api/alumni/achievements
Get current user's achievements.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "achievements": [
    {
      "achievementId": 1,
      "title": "AI Innovation Award",
      "description": "Developed an AI healthcare solution",
      "achievementDate": "2026-09-20"
    }
  ]
}
```

### POST /api/alumni/achievements
Add new achievement.

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "title": "Best Project Award",
  "description": "Won best project award for AI solution",
  "achievementDate": "2026-09-25"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Achievement added successfully",
  "achievement": { /* created achievement object */ }
}
```

### PUT /api/alumni/achievements/:id
Update achievement.

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "title": "Updated Achievement Title",
  "description": "Updated description",
  "achievementDate": "2026-09-26"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Achievement updated successfully"
}
```

### DELETE /api/alumni/achievements/:id
Delete achievement.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Achievement deleted successfully"
}
```

## Connections Endpoints

### POST /api/connections/request
Send connection request.

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "alumni_id": 2
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connection request sent successfully"
}
```

### GET /api/connections/requests
Get pending connection requests.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "requests": [
    {
      "connectionId": 1,
      "requesterName": "John Doe",
      "requesterTitle": "Student",
      "requesterDepartment": "CSE",
      "requesterYear": "2024",
      "status": "PENDING",
      "createdAt": "2026-09-29T10:00:00Z"
    }
  ]
}
```

### GET /api/connections/my-connections
Get user's connections.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "connections": [
    {
      "alumniId": 2,
      "name": "Ananya Rao",
      "title": "Data Scientist",
      "department": "AI",
      "graduationYear": 2021,
      "connectedAt": "2026-09-28T15:30:00Z"
    }
  ]
}
```

### GET /api/connections/sent-requests
Get sent connection requests.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "requests": [
    {
      "connectionId": 3,
      "recipientName": "Rahul Sharma",
      "recipientTitle": "Software Engineer",
      "status": "PENDING",
      "createdAt": "2026-09-29T09:00:00Z"
    }
  ]
}
```

### PUT /api/connections/:id
Respond to connection request.

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "status": "ACCEPTED" // or "REJECTED"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connection request accepted"
}
```

### DELETE /api/connections/:id
Cancel connection request.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Connection request cancelled"
}
```

## Mentorship Endpoints

### POST /api/mentorship
Request mentorship.

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "mentor_id": 2,
  "area_of_interest": "AI/ML",
  "message": "I would like guidance on ML internships"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Mentorship request sent successfully"
}
```

### GET /api/mentorship/my-requests
Get user's mentorship requests.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "requests": [
    {
      "mentorshipId": 1,
      "mentorName": "Rahul Sharma",
      "mentorId": 2,
      "areaOfInterest": "AI/ML",
      "message": "I would like guidance on ML internships",
      "status": "PENDING",
      "requestedAt": "2026-09-29T10:00:00Z"
    }
  ]
}
```

### GET /api/mentorship/requests
Get mentorship requests (for mentors).

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "requests": [
    {
      "mentorshipId": 1,
      "menteeName": "John Doe",
      "menteeId": 3,
      "areaOfInterest": "AI/ML",
      "message": "I would like guidance on ML internships",
      "status": "PENDING",
      "requestedAt": "2026-09-29T10:00:00Z"
    }
  ]
}
```

### GET /api/mentorship/active
Get active mentorships.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "mentorships": [
    {
      "mentorshipId": 1,
      "mentorName": "Rahul Sharma",
      "mentorId": 2,
      "areaOfInterest": "AI/ML",
      "startedAt": "2026-09-28T15:00:00Z"
    }
  ]
}
```

### GET /api/mentorship/overview
Get mentorship overview (for faculty).

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "active": 15,
  "completed": 42,
  "pending": 8
}
```

### PUT /api/mentorship/:id
Respond to mentorship request.

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "status": "ACCEPTED" // or "REJECTED", "COMPLETED"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Mentorship request accepted"
}
```

### DELETE /api/mentorship/:id
Cancel mentorship request.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Mentorship request cancelled"
}
```

## Events Endpoints

### GET /api/events
Get all events.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "events": [
    {
      "eventId": 1,
      "title": "Alumni Career Talk",
      "description": "Career guidance session",
      "eventDate": "2026-10-15T16:00:00Z",
      "venue": "Seminar Hall",
      "capacity": 100,
      "type": "Career Talk",
      "createdAt": "2026-09-20T10:00:00Z"
    }
  ]
}
```

### GET /api/events/upcoming
Get upcoming events.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "events": [
    {
      "eventId": 1,
      "title": "Alumni Career Talk",
      "eventDate": "2026-10-15T16:00:00Z",
      "venue": "Seminar Hall",
      "type": "Career Talk",
      "capacity": 100,
      "registrationCount": 45,
      "isRegistered": false
    }
  ]
}
```

### GET /api/events/past
Get past events.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "events": [
    {
      "eventId": 2,
      "title": "Previous Alumni Meet",
      "eventDate": "2026-08-20T14:00:00Z",
      "venue": "Main Auditorium",
      "attendanceCount": 80,
      "capacity": 100
    }
  ]
}
```

### GET /api/events/recent
Get recent events.

**Authentication:** Required (Bearer Token)

**Response:** Same structure as GET /api/events

### POST /api/events
Create new event (Faculty/Admin only).

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "title": "New Tech Workshop",
  "description": "Workshop on latest technologies",
  "eventDate": "2026-11-01T10:00:00Z",
  "venue": "Tech Hall",
  "capacity": 50,
  "type": "Workshop"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "event": { /* created event object */ }
}
```

### POST /api/events/:id/register
Register for event.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Event registration successful"
}
```

### GET /api/events/my-registrations
Get user's event registrations.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "registrations": [
    {
      "registrationId": 1,
      "eventId": 1,
      "eventTitle": "Alumni Career Talk",
      "eventDate": "2026-10-15T16:00:00Z",
      "venue": "Seminar Hall",
      "attendanceStatus": "REGISTERED",
      "registeredAt": "2026-09-29T10:00:00Z"
    }
  ]
}
```

### DELETE /api/events/registrations/:id
Cancel event registration.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration cancelled successfully"
}
```

## Jobs Endpoints

### GET /api/jobs
Get all job opportunities.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "jobs": [
    {
      "jobId": 1,
      "title": "ML Intern",
      "description": "Machine Learning internship position",
      "companyName": "XYZ Technologies",
      "location": "Bengaluru",
      "employmentType": "Internship",
      "deadline": "2026-10-20",
      "applicationUrl": "https://company.com/apply",
      "createdAt": "2026-09-25T10:00:00Z",
      "hasApplied": false
    }
  ]
}
```

### GET /api/jobs/recent
Get recent job postings.

**Authentication:** Required (Bearer Token)

**Response:** Same structure as GET /api/jobs

### POST /api/jobs
Post new job opportunity (Alumni only).

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "title": "Software Engineer",
  "description": "Full-stack software engineer position",
  "company": "ABC Corp",
  "location": "Mumbai",
  "employmentType": "Full-time",
  "deadline": "2026-11-15",
  "applicationUrl": "https://abccorp.com/careers"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Job posted successfully",
  "job": { /* created job object */ }
}
```

### POST /api/jobs/:id/apply
Apply for job.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Job application submitted successfully"
}
```

### GET /api/jobs/my-applications
Get user's job applications.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "applications": [
    {
      "applicationId": 1,
      "jobId": 1,
      "jobTitle": "ML Intern",
      "companyName": "XYZ Technologies",
      "location": "Bengaluru",
      "status": "PENDING",
      "appliedAt": "2026-09-29T10:00:00Z"
    }
  ]
}
```

### GET /api/jobs/my-postings
Get user's posted jobs (Alumni only).

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "jobs": [
    {
      "jobId": 1,
      "title": "Software Engineer",
      "companyName": "ABC Corp",
      "location": "Mumbai",
      "employmentType": "Full-time",
      "deadline": "2026-11-15",
      "applicationCount": 12
    }
  ]
}
```

### DELETE /api/jobs/:id
Delete job posting.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Job posting deleted successfully"
}
```

## Announcements Endpoints

### GET /api/announcements
Get all announcements.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "announcements": [
    {
      "announcementId": 1,
      "title": "University Announces New Scholarship Program",
      "content": "The university is pleased to announce...",
      "publishedAt": "2026-09-28T10:00:00Z",
      "createdBy": "Admin"
    }
  ]
}
```

### GET /api/announcements/recent
Get recent announcements.

**Authentication:** Required (Bearer Token)

**Response:** Same structure as GET /api/announcements

### POST /api/announcements
Create new announcement (Faculty/Admin only).

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "title": "Important Notice",
  "content": "This is an important announcement for all students and alumni."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "announcement": { /* created announcement object */ }
}
```

## Notifications Endpoints

### GET /api/notifications
Get user's notifications.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "notifications": [
    {
      "notificationId": 1,
      "message": "Rahul accepted your connection request.",
      "read": false,
      "createdAt": "2026-09-29T10:00:00Z"
    }
  ]
}
```

### PUT /api/notifications/:id/read
Mark notification as read.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### PUT /api/notifications/mark-all-read
Mark all notifications as read.

**Authentication:** Required (Bearer Token)

**Response (Success):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## Admin Endpoints

### GET /api/admin/statistics
Get system statistics.

**Authentication:** Required (Bearer Token, Admin only)

**Response:**
```json
{
  "totalUsers": 2450,
  "totalAlumni": 520,
  "totalStudents": 1850,
  "totalFaculty": 80,
  "totalEvents": 32,
  "totalMentorships": 74
}
```

### GET /api/admin/pending-verifications
Get pending alumni verifications.

**Authentication:** Required (Bearer Token, Admin only)

**Response:**
```json
{
  "verifications": [
    {
      "alumniId": 5,
      "firstName": "New",
      "lastName": "Alumni",
      "departmentCode": "ECE",
      "graduationYear": 2023,
      "companyName": "Startup",
      "verificationStatus": "PENDING"
    }
  ]
}
```

### GET /api/admin/alumni-verification
Get alumni verification list with filters.

**Authentication:** Required (Bearer Token, Admin only)

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, VERIFIED, REJECTED, ALL)

**Response:** Same structure as GET /api/admin/pending-verifications

### PUT /api/admin/verify-alumni/:id
Verify alumni.

**Authentication:** Required (Bearer Token, Admin only)

**Response (Success):**
```json
{
  "success": true,
  "message": "Alumni verified successfully"
}
```

### PUT /api/admin/reject-alumni/:id
Reject alumni verification.

**Authentication:** Required (Bearer Token, Admin only)

**Request:**
```json
{
  "reason": "Insufficient documentation provided"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Alumni verification rejected"
}
```

### GET /api/admin/pending-events
Get pending event approvals.

**Authentication:** Required (Bearer Token, Admin only)

**Response:**
```json
{
  "events": [
    {
      "eventId": 5,
      "title": "Pending Event",
      "eventDate": "2026-11-01T10:00:00Z",
      "venue": "TBD",
      "creatorName": "Faculty Member"
    }
  ]
}
```

### PUT /api/admin/approve-event/:id
Approve event.

**Authentication:** Required (Bearer Token, Admin only)

**Response (Success):**
```json
{
  "success": true,
  "message": "Event approved successfully"
}
```

### GET /api/admin/recent-activity
Get recent system activity.

**Authentication:** Required (Bearer Token, Admin only)

**Response:**
```json
{
  "activities": [
    {
      "description": "New user registered: John Doe",
      "createdAt": "2026-09-29T09:00:00Z"
    }
  ]
}
```

## Faculty Endpoints

### GET /api/faculty/department-stats
Get department statistics.

**Authentication:** Required (Bearer Token, Faculty only)

**Response:**
```json
{
  "students": 128,
  "alumni": 84
}
```

### GET /api/faculty/students
Get department students.

**Authentication:** Required (Bearer Token, Faculty only)

**Response:**
```json
{
  "students": [
    {
      "userId": 10,
      "firstName": "Student",
      "lastName": "Name",
      "registrationNumber": "REG123456",
      "departmentCode": "CSE"
    }
  ]
}
```

### GET /api/faculty/alumni
Get department alumni.

**Authentication:** Required (Bearer Token, Faculty only)

**Response:**
```json
{
  "alumni": [
    {
      "alumniId": 2,
      "firstName": "Alumni",
      "lastName": "Name",
      "designation": "Engineer",
      "companyName": "Company",
      "graduationYear": 2020
    }
  ]
}
```

## Error Handling

All endpoints follow consistent error handling:

### Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Authentication Behavior
- Most endpoints require authentication via Bearer Token
- Include token in Authorization header: `Authorization: Bearer <token>`
- Token expiration returns 401 status
- Frontend handles 401 by redirecting to login page

## Common Response Patterns

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "data": [ /* array of items */ ],
  "currentPage": 1,
  "totalPages": 5,
  "totalItems": 50
}
```

## Notes for Backend Implementation

1. **Authentication**: Implement JWT-based authentication with token storage in localStorage
2. **Authorization**: Implement role-based access control (RBAC)
3. **Validation**: Validate all input data according to database schema constraints
4. **Error Handling**: Return consistent error messages with appropriate HTTP status codes
5. **Pagination**: Implement pagination for list endpoints with default page size of 10
6. **Filtering**: Support filtering parameters for search endpoints
7. **Date Formatting**: Return dates in ISO 8601 format
8. **CORS**: Enable CORS for frontend-backend communication
9. **Rate Limiting**: Consider implementing rate limiting for API protection
10. **Logging**: Implement server-side logging for debugging and monitoring

This frontend implementation expects the backend to follow these API specifications exactly for proper integration and functionality.