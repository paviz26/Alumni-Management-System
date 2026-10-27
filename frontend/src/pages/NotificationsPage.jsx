import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NotificationsPage = () => {
  const { authToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.get('/notifications', authToken);
      setNotifications(Array.isArray(data) ? data : data?.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const data = await api.put(`/notifications/${notificationId}/read`, {}, authToken);
      if (data.success) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const data = await api.put('/notifications/mark-all-read', {}, authToken);
      if (data.success) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Notifications">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Notifications</h3>
          <button className="btn btn-secondary" onClick={markAllAsRead}>
            Mark All as Read
          </button>
        </div>

        {notifications.length === 0 ? (
          <p>No notifications.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.notificationId}
              className={`notification-item ${notification.read ? '' : 'unread'}`}
              onClick={() => !notification.read && markAsRead(notification.notificationId)}
              style={{ cursor: !notification.read ? 'pointer' : 'default' }}
            >
              <p>{notification.message}</p>
              <span className="notification-time">{new Date(notification.createdAt).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
