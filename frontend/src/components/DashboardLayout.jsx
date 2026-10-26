import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children, title }) => {
  const { currentUser, logout } = useAuth();

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <h1>{title}</h1>
          <div className="user-info">
            <div className="user-avatar">
              {getInitials(currentUser?.firstName, currentUser?.lastName)}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>
                {currentUser?.firstName} {currentUser?.lastName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                {currentUser?.role}
              </div>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
