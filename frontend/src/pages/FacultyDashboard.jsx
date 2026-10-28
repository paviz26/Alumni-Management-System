import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const FacultyDashboard = () => {
  const { currentUser, authToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [mentorshipOverview, setMentorshipOverview] = useState({ active: 0, completed: 0, pending: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notifData, studentsData, alumniData, mentorshipData, announcementsData] = await Promise.all([
        api.get('/notifications', authToken),
        api.get('/faculty/students', authToken),
        api.get('/faculty/alumni', authToken),
        api.get('/mentorship/overview', authToken),
        api.get('/announcements/recent', authToken),
      ]);

      setNotifications(Array.isArray(notifData) ? notifData : notifData?.notifications || []);
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData?.students || []);
      setAlumni(Array.isArray(alumniData) ? alumniData : alumniData?.alumni || []);
      setMentorshipOverview(mentorshipData || { active: 0, completed: 0, pending: 0 });
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData.map(a => ({
        ...a,
        publishedAt: a.published_at || a.publishedAt,
        createdOn: a.created_on || a.createdOn
      })) : (announcementsData?.announcements || []).map(a => ({
        ...a,
        publishedAt: a.published_at || a.publishedAt,
        createdOn: a.created_on || a.createdOn
      })));
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

        <div className="card">
          <h3>Recent Announcements</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <Link to="/announcements" className="btn btn-primary" style={{ fontSize: '12px', padding: '5px 10px' }}>
              View All
            </Link>
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'FACULTY') && (
              <Link to="/announcements" className="btn btn-success" style={{ fontSize: '12px', padding: '5px 10px' }}>
                Create
              </Link>
            )}
          </div>
          {announcements.length === 0 ? (
            <p>No recent announcements.</p>
          ) : (
            announcements.slice(0, 3).map((announcement) => (
              <div key={announcement.announcementId} className="list-item">
                <div className="list-item-info">
                  <h4>{announcement.title}</h4>
                  <p>{announcement.content?.substring(0, 100) || ''}{announcement.content && announcement.content.length > 100 ? '...' : ''}</p>
                  <p className="notification-time">{new Date(announcement.publishedAt || announcement.createdOn).toLocaleDateString()}</p>
                </div>
                <div className="list-item-actions">
                  <Link to={`/announcements/${announcement.announcementId}`} className="btn btn-primary">View</Link>
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
