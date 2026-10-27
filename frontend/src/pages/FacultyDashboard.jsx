import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const FacultyDashboard = () => {
  const { currentUser, authToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [mentorshipOverview, setMentorshipOverview] = useState({ active: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notifData, studentsData, alumniData, mentorshipData] = await Promise.all([
        api.get('/notifications', authToken),
        api.get('/faculty/students', authToken),
        api.get('/faculty/alumni', authToken),
        api.get('/mentorship/overview', authToken),
      ]);

      setNotifications(Array.isArray(notifData) ? notifData : notifData?.notifications || []);
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData?.students || []);
      setAlumni(Array.isArray(alumniData) ? alumniData : alumniData?.alumni || []);
      setMentorshipOverview(mentorshipData || { active: 0, completed: 0, pending: 0 });
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
          <h3>Students</h3>
          <div className="stat-number">{students.length}</div>
          <div className="stat-label">Department Students</div>
        </div>

        <div className="card stat-card">
          <h3>Alumni</h3>
          <div className="stat-number">{alumni.length}</div>
          <div className="stat-label">Department Alumni</div>
        </div>

        <div className="card stat-card">
          <h3>Active Mentorships</h3>
          <div className="stat-number">{mentorshipOverview.active}</div>
          <div className="stat-label">Ongoing Programs</div>
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
          <h3>Department Students</h3>
          {students.length === 0 ? (
            <p>No students in department.</p>
          ) : (
            students.slice(0, 5).map((student) => (
              <div key={student.userId} className="list-item">
                <div className="list-item-info">
                  <h4>{student.firstName} {student.lastName}</h4>
                  <p>{student.registrationNumber} • {student.departmentCode}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Department Alumni</h3>
          {alumni.length === 0 ? (
            <p>No alumni in department.</p>
          ) : (
            alumni.slice(0, 5).map((alum) => (
              <div key={alum.alumniId} className="list-item">
                <div className="list-item-info">
                  <h4>{alum.firstName} {alum.lastName}</h4>
                  <p>{alum.designation} @ {alum.companyName}</p>
                  <p>Graduated: {alum.graduationYear}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
