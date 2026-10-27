import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const MentorshipPage = () => {
  const { authToken, currentUser } = useAuth();
  const [availableMentors, setAvailableMentors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadMentorshipData();
  }, []);

  const loadMentorshipData = async () => {
    setErrorMessage('');
    try {
      if (currentUser?.role === 'STUDENT') {
        const [mentorsData, myRequestsData] = await Promise.all([
          api.get('/alumni/available-mentors', authToken),
          api.get('/mentorship/my-requests', authToken),
        ]);

        setAvailableMentors(Array.isArray(mentorsData) ? mentorsData : mentorsData?.mentors || []);
        setMyRequests(Array.isArray(myRequestsData) ? myRequestsData : myRequestsData?.requests || []);
      } else if (currentUser?.role === 'ALUMNI') {
        const [requestsData, activeData] = await Promise.all([
          api.get('/mentorship/requests', authToken),
          api.get('/mentorship/active', authToken),
        ]);

        setMentorshipRequests(Array.isArray(requestsData) ? requestsData : requestsData?.requests || []);
        setActiveMentorships(Array.isArray(activeData) ? activeData : activeData?.mentorships || []);
      } else if (currentUser?.role === 'FACULTY') {
        const overviewData = await api.get('/mentorship/overview', authToken);
        setOverview(overviewData);
      }
    } catch (error) {
      console.error('Error loading mentorship data:', error);
      setErrorMessage(error.message || 'Failed to load mentorship data.');
    } finally {
      setLoading(false);
    }
  };

  const requestMentorship = async (mentorId) => {
    const areaOfInterest = prompt('Enter your area of interest:');
    const message = prompt('Enter your message to the mentor:');

    if (!areaOfInterest || !message) {
      alert('Please provide both area of interest and message.');
      return;
    }

    try {
      const data = await api.post('/mentorship', {
        mentor_id: mentorId,
        area_of_interest: areaOfInterest,
        message,
      }, authToken);

      if (data.success) {
        alert('Mentorship request sent successfully!');
        loadMentorshipData();
      } else {
        alert(data.message || 'Failed to send mentorship request');
      }
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      alert(error.message || 'Failed to send mentorship request.');
    }
  };

  const respondToRequest = async (mentorshipId, status) => {
    try {
      const data = await api.put(`/mentorship/${mentorshipId}`, { status }, authToken);
      if (data.success) {
        alert(`Mentorship request ${status.toLowerCase()}!`);
        loadMentorshipData();
      } else {
        alert(data.message || 'Failed to respond to request');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      alert(error.message || 'Failed to update mentorship request.');
    }
  };

  const cancelRequest = async (mentorshipId) => {
    if (!confirm('Are you sure you want to cancel this mentorship request?')) return;

    try {
      await api.delete(`/mentorship/${mentorshipId}`, authToken);
      alert('Mentorship request cancelled.');
      loadMentorshipData();
    } catch (error) {
      console.error('Error cancelling mentorship request:', error);
      alert(error.message || 'Failed to cancel mentorship request.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Mentorship">
      <div className="dashboard-grid">
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        {currentUser?.role === 'STUDENT' && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3>Available Mentors</h3>
            {availableMentors.length === 0 ? (
              <p>No mentors available.</p>
            ) : (
              availableMentors.map((mentor) => (
                <div key={mentor.alumniId} className="list-item">
                  <div className="list-item-info">
                    <h4>{mentor.firstName} {mentor.lastName}</h4>
                    <p>{mentor.designation} @ {mentor.companyName}</p>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-primary" onClick={() => requestMentorship(mentor.alumniId)}>
                      Request Mentorship
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {currentUser?.role === 'STUDENT' && (
          <div className="card">
            <h3>My Requests</h3>
            {myRequests.length === 0 ? (
              <p>No mentorship requests yet.</p>
            ) : (
              myRequests.map((request) => (
                <div key={request.mentorshipId} className="list-item">
                  <div className="list-item-info">
                    <h4>{request.mentorName}</h4>
                    <p>Area: {request.areaOfInterest}</p>
                    <p>Status: {request.status}</p>
                  </div>
                  {request.status === 'PENDING' && (
                    <div className="list-item-actions">
                      <button className="btn btn-secondary" onClick={() => cancelRequest(request.mentorshipId)}>
                        Cancel request
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {currentUser?.role === 'ALUMNI' && (
          <>
            <div className="card">
              <h3>Pending Requests</h3>
              {mentorshipRequests.filter((request) => request.status === 'PENDING').length === 0 ? (
                <p>No pending requests.</p>
              ) : (
                mentorshipRequests.filter((request) => request.status === 'PENDING').map((request) => (
                  <div key={request.mentorshipId} className="list-item">
                    <div className="list-item-info">
                      <h4>{request.menteeName}</h4>
                      <p>Area: {request.areaOfInterest}</p>
                      <p>{request.message}</p>
                    </div>
                    <div className="list-item-actions">
                      <button className="btn btn-success" onClick={() => respondToRequest(request.mentorshipId, 'ACCEPTED')}>
                        Accept
                      </button>
                      <button className="btn btn-secondary" onClick={() => respondToRequest(request.mentorshipId, 'REJECTED')}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Active Mentorships</h3>
              {activeMentorships.filter((mentorship) => mentorship.status === 'ACCEPTED').length === 0 ? (
                <p>No active mentorships.</p>
              ) : (
                activeMentorships.filter((mentorship) => mentorship.status === 'ACCEPTED').map((mentorship) => (
                  <div key={mentorship.mentorshipId} className="list-item">
                    <div className="list-item-info">
                      <h4>{mentorship.mentorName}</h4>
                      <p>Area: {mentorship.areaOfInterest}</p>
                      <p>Requested: {mentorship.requestedAt ? new Date(mentorship.requestedAt).toLocaleDateString() : 'Date unavailable'}</p>
                    </div>
                    <div className="list-item-actions">
                      <button className="btn btn-primary" onClick={() => respondToRequest(mentorship.mentorshipId, 'COMPLETED')}>
                        Complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {currentUser?.role === 'FACULTY' && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3>Mentorship Overview</h3>
            {!overview ? (
              <p>No mentorship data available.</p>
            ) : (
              <div>
                <p>Active: {overview.active || 0}</p>
                <p>Pending: {overview.pending || 0}</p>
                <p>Completed: {overview.completed || 0}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MentorshipPage;
