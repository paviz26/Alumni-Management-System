import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AlumniDashboard = () => {
  const { currentUser, authToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [connections, setConnections] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [stats, setStats] = useState({ connections: 0, mentorshipRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notifData, connectionsData, mentorshipData, statsData] = await Promise.all([
        api.get('/notifications', authToken),
        api.get('/connections/my-connections', authToken),
        api.get('/mentorship/requests', authToken),
        api.get('/alumni/stats', authToken),
      ]);

      setNotifications(Array.isArray(notifData) ? notifData : notifData?.notifications || []);
      setConnections(Array.isArray(connectionsData) ? connectionsData : connectionsData?.connections || []);
      setMentorshipRequests(Array.isArray(mentorshipData) ? mentorshipData : mentorshipData?.requests || []);
      setStats(statsData || { connections: 0, mentorshipRequests: 0 });
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
          <h3>Connections</h3>
          <div className="stat-number">{stats.connections}</div>
          <div className="stat-label">Total Connections</div>
        </div>

        <div className="card stat-card">
          <h3>Mentorship Requests</h3>
          <div className="stat-number">{stats.mentorshipRequests}</div>
          <div className="stat-label">Pending Requests</div>
        </div>

        <div className="card">
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

        <div className="card">
          <h3>Recent Connections</h3>
          {connections.length === 0 ? (
            <p>No connections yet.</p>
          ) : (
            connections.slice(0, 5).map((connection) => (
              <div key={connection.alumniId} className="list-item">
                <div className="list-item-info">
                  <h4>{connection.name}</h4>
                  <p>{connection.title} • {connection.department}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Mentorship Requests</h3>
          {mentorshipRequests.length === 0 ? (
            <p>No mentorship requests.</p>
          ) : (
            mentorshipRequests.slice(0, 5).map((request) => (
              <div key={request.mentorshipId} className="list-item">
                <div className="list-item-info">
                  <h4>{request.menteeName}</h4>
                  <p>Area: {request.areaOfInterest}</p>
                  <p>Status: {request.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AlumniDashboard;
