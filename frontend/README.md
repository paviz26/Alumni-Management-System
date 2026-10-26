# Alumni Management System - Frontend (React)

This is the React frontend for the Alumni Management System, migrated from vanilla HTML/CSS/JS.

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client (optional, using fetch API)

## Prerequisites

- Node.js (v16 or higher)
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
│   ├── components/          # Reusable components
│   │   ├── DashboardLayout.jsx
│   │   └── Sidebar.jsx
│   ├── context/            # React Context
│   │   └── AuthContext.jsx
│   ├── pages/              # Page components
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── AlumniDashboard.jsx
│   │   ├── FacultyDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── DirectoryPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── JobsPage.jsx
│   │   ├── MentorshipPage.jsx
│   │   ├── ConnectionsPage.jsx
│   │   ├── AchievementsPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── AnnouncementsPage.jsx
│   │   └── AdminVerificationPage.jsx
│   ├── utils/              # Utility functions
│   │   └── api.js
│   ├── App.jsx             # Main app component with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies
```

## Features

- **Authentication**: Login, Register, Logout with JWT token management
- **Role-based Access**: Different dashboards for Students, Alumni, Faculty, and Admin
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
- **Profile**: User profile management
- **Directory**: Alumni directory with search
- **Events**: Event listings and registration
- **Jobs**: Job postings and applications
- **Mentorship**: Mentorship program management
- **Connections**: Connection requests and management
- **Achievements**: Alumni achievements
- **Notifications**: User notifications
- **Announcements**: System announcements
- **Admin Verification**: Alumni verification for admins

## Backend Integration

Make sure the backend is running on `http://localhost:5000` before starting the frontend.

```bash
# From the project root
cd backend
npm install
npm run dev
```

## Migration Notes

This React application was migrated from the original HTML/CSS/JS frontend. All original functionality has been preserved:

- All API endpoints remain the same
- All UI components maintain the same styling
- Authentication flow is identical
- Role-based access control is preserved
