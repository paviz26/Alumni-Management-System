import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminDashboard = () => {
  const { currentUser, authToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalAlumni: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalEvents: 0,
    totalMentorships: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notifData, statsData, activityData] = await Promise.all([
        api.get('/notifications', authToken),
        api.get('/admin/statistics', authToken),
        api.get('/admin/recent-activity', authToken),
      ]);

      setNotifications(Array.isArray(notifData) ? notifData : notifData?.notifications || []);
      setStatistics(statsData || statistics);
      setRecentActivity(Array.isArray(activityData) ? activityData : activityData?.activities || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title={`Welcome, ${currentUser?.firstName}!`}>
      <div className="dashboard-grid">
        <div className="card stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{statistics.totalUsers}</div>
          <div className="stat-label">Registered Users</div>
        </div>

        <div className="card stat-card">
          <h3>Alumni</h3>
          <div className="stat-number">{statistics.totalAlumni}</div>
          <div className="stat-label">Verified Alumni</div>
        </div>

        <div className="card stat-card">
          <h3>Students</h3>
          <div className="stat-number">{statistics.totalStudents}</div>
          <div className="stat-label">Active Students</div>
        </div>

        <div className="card stat-card">
          <h3>Faculty</h3>
          <div className="stat-number">{statistics.totalFaculty}</div>
          <div className="stat-label">Faculty Members</div>
        </div>

        <div className="card stat-card">
          <h3>Events</h3>
          <div className="stat-number">{statistics.totalEvents}</div>
          <div className="stat-label">Total Events</div>
        </div>

        <div className="card stat-card">
          <h3>Mentorships</h3>
          <div className="stat-number">{statistics.totalMentorships}</div>
          <div className="stat-label">Active Mentorships</div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <p>No new notifications.</p>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div key={notification.notificationId} className={`notification-item ${notification.read ? '' : 'unread'}`}>
                <p>{notification.message}</p>
                <span className="notification-time">{new Date(notification.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p>No recent activity.</p>
          ) : (
            recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="list-item">
                <div className="list-item-info">
                  <p>{activity.description}</p>
                  <span className="notification-time">{new Date(activity.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
