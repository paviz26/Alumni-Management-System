import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const getNavItems = () => {
    if (!currentUser) return [];

    const commonItems = [
      { path: '/profile', label: 'Profile' },
      { path: '/directory', label: 'Directory' },
      { path: '/events', label: 'Events' },
      { path: '/notifications', label: 'Notifications' },
    ];

    switch (currentUser.role) {
      case 'STUDENT':
        return [
          { path: '/student-dashboard', label: 'Dashboard' },
          ...commonItems,
          { path: '/jobs', label: 'Jobs' },
          { path: '/mentorship', label: 'Mentorship' },
          { path: '/connections', label: 'Connections' },
        ];
      case 'ALUMNI':
        return [
          { path: '/alumni-dashboard', label: 'Dashboard' },
          ...commonItems,
          { path: '/jobs', label: 'Jobs' },
          { path: '/mentorship', label: 'Mentorship' },
          { path: '/connections', label: 'Connections' },
          { path: '/achievements', label: 'Achievements' },
          { path: '/donations', label: 'Donations' },
        ];
      case 'FACULTY':
        return [
          { path: '/faculty-dashboard', label: 'Dashboard' },
          ...commonItems,
          { path: '/mentorship', label: 'Mentorship' },
          { path: '/announcements', label: 'Announcements' },
        ];
      case 'ADMIN':
        return [
          { path: '/admin-dashboard', label: 'Dashboard' },
          { path: '/admin-verification', label: 'Verifications' },
          { path: '/directory', label: 'Directory' },
          { path: '/events', label: 'Events' },
          { path: '/announcements', label: 'Announcements' },
          { path: '/notifications', label: 'Notifications' },
          { path: '/donations', label: 'Donations' },
        ];
      default:
        return commonItems;
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>ALUMNI CONNECT</h2>
      </div>
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <a href="#" onClick={handleLogout}>Logout</a>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
