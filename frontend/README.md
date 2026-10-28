# Alumni Management System - Frontend

React client for the Alumni Management System. The frontend calls the FastAPI backend through Vite's `/api` proxy.

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Fetch API** - HTTP client with shared status/error handling

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

## Installation

```bash
cd frontend
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Shared layout and navigation
│   ├── context/          # Authentication state
│   ├── pages/            # Role-specific pages and workflows
│   ├── utils/api.js      # Fetch wrapper and HTTP error handling
│   ├── App.jsx           # Routes and role guards
│   └── index.css         # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Features

- **Authentication**: Login, Register, Logout with JWT token management
- **Role-based Access**: Different dashboards and actions for Students, Alumni, Faculty, and Admin
- **Responsive Design**: Mobile-friendly UI
- **API Integration**: Connected to backend via proxy at `/api`
- **State Management**: React Context for authentication state

## API Integration

The frontend uses a proxy configuration in `vite.config.js` to forward API requests to the backend:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  }
}
```

All API calls use the `/api` prefix and are proxied to `http://localhost:5000/api`.

## Authentication

Authentication state is managed using React Context (`AuthContext`). The token and user data are stored in `localStorage` for persistence.

## Pages

- **Landing Page**: Public homepage with feature highlights
- **Login**: User authentication
- **Register**: New user registration with role selection
- **Student Dashboard**: Student-specific features
- **Alumni Dashboard**: Alumni-specific features
- **Faculty Dashboard**: Faculty-specific features
- **Admin Dashboard**: Admin-specific features
- **Profile**: Alumni can edit their own profile; other roles receive an alumni-profile explanation
- **Directory**: Alumni search filters and pagination; private contact details are not displayed
- **Events**: Alumni registration/cancellation, faculty/admin event creation and editing, and admin approval queue
- **Jobs**: Alumni posting management; students record in-app applications and can separately open safe employer links
- **Mentorship**: Students discover/request/cancel; alumni respond and complete accepted relationships; faculty see department totals
- **Connections**: Connection requests and management
- **Achievements**: Alumni achievements
- **Notifications**: User notifications
- **Announcements**: System announcements
- **Admin Verification**: Alumni verification for admins
- **Donations**: Alumni pledge records and admin status/summary view

## Backend Integration

Start the backend from the `backend/` directory after configuring its environment and applying migrations:

```bash
cd backend
uvicorn app.main:app --reload --port 5000
```

Then start the frontend from `frontend/`:

```bash
npm install
npm run dev
```

The frontend is served at `http://localhost:3000`. If the backend is unavailable, pages that call the API will show request errors. See the backend setup and authoritative endpoint/role documentation in [the repository README](../README.md) and [APIS.md](../APIS.md).

## Workflow boundaries

- Event invitations create in-app invitation and notification records only; there is no invitation list or RSVP response flow.
- Donation entries are pledge/recordkeeping data. Marking one completed is not proof of payment, and there is no payment integration.
- Job applications recorded by the API are separate from any application submitted on an employer's site.
- Public registration supports STUDENT, ALUMNI, and FACULTY; ADMIN accounts are provisioned by an administrator.
