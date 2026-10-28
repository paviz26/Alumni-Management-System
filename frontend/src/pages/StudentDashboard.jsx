import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StudentDashboard = () => {
  const { currentUser, authToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [suggestedAlumni, setSuggestedAlumni] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [careerOpportunities, setCareerOpportunities] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notifData, alumniData, eventsData, jobsData, mentorshipData, announcementsData] = await Promise.all([
        api.get('/notifications', authToken),
        api.get('/alumni/suggested', authToken),
        api.get('/events/upcoming', authToken),
        api.get('/jobs/recent', authToken),
        api.get('/mentorship/my-requests', authToken),
        api.get('/announcements/recent', authToken),
      ]);

      setNotifications(Array.isArray(notifData) ? notifData : notifData?.notifications || []);
      setSuggestedAlumni(Array.isArray(alumniData) ? alumniData : alumniData?.alumni || []);
      setUpcomingEvents(Array.isArray(eventsData) ? eventsData : eventsData?.events || []);
      setCareerOpportunities(Array.isArray(jobsData) ? jobsData : jobsData?.jobs || []);
      setMentorshipRequests(Array.isArray(mentorshipData) ? mentorshipData : mentorshipData?.requests || []);
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
      setErrorMessage(error.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const connectWithAlumni = async (alumniId) => {
    try {
      const data = await api.post('/connections/request', { alumni_id: alumniId }, authToken);
      if (data.success) {
        alert('Connection request sent successfully!');
        loadDashboardData();
      } else {
        alert(data.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert(error.message || 'Failed to send connection request.');
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title={`Welcome, ${currentUser?.firstName}!`}>
      <div className="dashboard-grid">
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Quick Actions</h3>
          <p><Link to="/directory">Search the alumni directory</Link></p>
          <p><Link to="/mentorship">Find a mentor</Link></p>
          <p><Link to="/jobs">Browse jobs and record applications</Link></p>
        </div>

        <div className="card">
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <p>No new notifications.</p>
          ) : (
            notifications.slice(0, 3).map((notification) => (
              <div key={notification.notificationId} className={`notification-item ${notification.read ? '' : 'unread'}`}>
                <p>{notification.message}</p>
                <span className="notification-time">{formatDate(notification.createdAt)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Suggested Alumni</h3>
          {suggestedAlumni.length === 0 ? (
            <p>No suggested alumni available.</p>
          ) : (
            suggestedAlumni.slice(0, 3).map((alum) => (
              <div key={alum.alumniId} className="list-item">
                <div className="list-item-info">
                  <h4>{alum.firstName} {alum.lastName}</h4>
                  <p>{alum.designation} @ {alum.companyName}</p>
                  <p>{alum.departmentCode} • {alum.graduationYear}</p>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-primary" onClick={() => connectWithAlumni(alum.alumniId)}>
                    Connect
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p>No upcoming events.</p>
          ) : (
            upcomingEvents.slice(0, 3).map((event) => (
              <div key={event.eventId} className="list-item">
                <div className="list-item-info">
                  <h4>{event.title}</h4>
                  <p>{formatDate(event.eventDate)} • {event.venue}</p>
                  <p>Type: {event.type}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Career Opportunities</h3>
          {careerOpportunities.length === 0 ? (
            <p>No recent job postings.</p>
          ) : (
            careerOpportunities.slice(0, 3).map((job) => (
              <div key={job.jobId} className="list-item">
                <div className="list-item-info">
                  <h4>{job.title}</h4>
                  <p>{job.companyName} • {job.location}</p>
                  <p>Deadline: {formatDate(job.deadline)}</p>
                </div>
                <div className="list-item-actions">
                  <Link to="/jobs" className="btn btn-primary">View job</Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Mentorship Status</h3>
          {mentorshipRequests.length === 0 ? (
            <>
              <p>No active mentorship requests.</p>
              <Link to="/mentorship" className="btn btn-primary">Find a Mentor</Link>
            </>
          ) : (
            mentorshipRequests.slice(0, 3).map((mentorship) => (
              <div key={mentorship.mentorshipId} className="list-item">
                <div className="list-item-info">
                  <h4>{mentorship.mentorName}</h4>
                  <p>Status: {mentorship.status}</p>
                  <p>Area: {mentorship.areaOfInterest}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Recent Announcements</h3>
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

export default StudentDashboard;
