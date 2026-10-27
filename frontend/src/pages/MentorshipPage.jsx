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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentorshipData();
  }, []);

  const loadMentorshipData = async () => {
    try {
      const [mentorsData, myRequestsData] = await Promise.all([
        api.get('/alumni/available-mentors', authToken),
        api.get('/mentorship/my-requests', authToken),
      ]);

      setAvailableMentors(Array.isArray(mentorsData) ? mentorsData : mentorsData?.mentors || []);
      setMyRequests(Array.isArray(myRequestsData) ? myRequestsData : myRequestsData?.requests || []);

      if (currentUser?.role === 'ALUMNI' || currentUser?.role === 'FACULTY') {
        const [requestsData, activeData] = await Promise.all([
          api.get('/mentorship/requests', authToken),
          api.get('/mentorship/active', authToken),
        ]);

        setMentorshipRequests(Array.isArray(requestsData) ? requestsData : requestsData?.requests || []);
        setActiveMentorships(Array.isArray(activeData) ? activeData : activeData?.mentorships || []);
      }
    } catch (error) {
      console.error('Error loading mentorship data:', error);
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
      alert('Network error. Please try again.');
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
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Mentorship">
      <div className="dashboard-grid">
        {(currentUser?.role === 'STUDENT' || currentUser?.role === 'ALUMNI') && (
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
              </div>
            ))
          )}
        </div>

        {(currentUser?.role === 'ALUMNI' || currentUser?.role === 'FACULTY') && (
          <>
            <div className="card">
              <h3>Pending Requests</h3>
              {mentorshipRequests.length === 0 ? (
                <p>No pending requests.</p>
              ) : (
                mentorshipRequests.map((request) => (
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
              {activeMentorships.length === 0 ? (
                <p>No active mentorships.</p>
              ) : (
                activeMentorships.map((mentorship) => (
                  <div key={mentorship.mentorshipId} className="list-item">
                    <div className="list-item-info">
                      <h4>{mentorship.mentorName}</h4>
                      <p>Area: {mentorship.areaOfInterest}</p>
                      <p>Started: {new Date(mentorship.startedAt).toLocaleDateString()}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default MentorshipPage;
