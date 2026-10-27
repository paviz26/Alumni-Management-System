import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminVerificationPage = () => {
  const { authToken } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    loadVerifications();
    loadPendingEvents();
  }, [filter]);

  const loadVerifications = async () => {
    try {
      const endpoint = filter === 'ALL' ? '/admin/alumni-verification' : `/admin/alumni-verification?status=${filter}`;
      const data = await api.get(endpoint, authToken);
      setVerifications(Array.isArray(data) ? data : data?.verifications || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
      setErrorMessage(error.message || 'Failed to load alumni verifications.');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingEvents = async () => {
    try {
      const data = await api.get('/admin/pending-events', authToken);
      setPendingEvents(Array.isArray(data) ? data : data?.events || []);
    } catch (error) {
      console.error('Error loading pending events:', error);
      setErrorMessage(error.message || 'Failed to load pending events.');
    }
  };

  const verifyAlumni = async (alumniId) => {
    if (!confirm('Are you sure you want to verify this alumni?')) return;

    try {
      const data = await api.put(`/admin/verify-alumni/${alumniId}`, {}, authToken);
      if (data.success) {
        alert('Alumni verified successfully!');
        loadVerifications();
      } else {
        alert(data.message || 'Failed to verify alumni');
      }
    } catch (error) {
      console.error('Error verifying alumni:', error);
      alert(error.message || 'Failed to verify alumni.');
    }
  };

  const rejectAlumni = async (alumniId) => {
    if (!confirm('Are you sure you want to reject this alumni?')) return;

    try {
      const data = await api.put(`/admin/reject-alumni/${alumniId}`, {}, authToken);
      if (data.success) {
        alert('Alumni verification rejected!');
        loadVerifications();
      } else {
        alert(data.message || 'Failed to reject alumni');
      }
    } catch (error) {
      console.error('Error rejecting alumni:', error);
      alert(error.message || 'Failed to reject alumni verification.');
    }
  };

  const approveEvent = async (eventId) => {
    if (!confirm('Are you sure you want to approve this event?')) return;

    try {
      const data = await api.put(`/admin/approve-event/${eventId}`, {}, authToken);
      if (data.success) {
        alert('Event approved successfully!');
        loadPendingEvents();
      } else {
        alert(data.message || 'Failed to approve event');
      }
    } catch (error) {
      console.error('Error approving event:', error);
      alert(error.message || 'Failed to approve event.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Admin Verification">
      <div className="dashboard-grid">
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Pending Verifications</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All</option>
            </select>
          </div>

          {verifications.length === 0 ? (
            <p>No verifications found.</p>
          ) : (
            verifications.map((verification) => (
              <div key={verification.alumniId} className="list-item">
                <div className="list-item-info">
                  <h4>{verification.firstName} {verification.lastName}</h4>
                  <p>{verification.departmentCode} • {verification.graduationYear}</p>
                  <p>{verification.companyName}</p>
                  <p>Status: {verification.verificationStatus}</p>
                </div>
                <div className="list-item-actions">
                  {verification.verificationStatus === 'PENDING' && (
                    <>
                      <button className="btn btn-success" onClick={() => verifyAlumni(verification.alumniId)}>
                        Verify
                      </button>
                      <button className="btn btn-secondary" onClick={() => rejectAlumni(verification.alumniId)}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Pending Events</h3>
          {pendingEvents.length === 0 ? (
            <p>No pending events.</p>
          ) : (
            pendingEvents.map((event) => (
              <div key={event.eventId} className="list-item">
                <div className="list-item-info">
                  <h4>{event.title}</h4>
                  <p>{new Date(event.eventDate).toLocaleString()}</p>
                  <p>Venue: {event.venue}</p>
                  <p>Type: {event.type}</p>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-success" onClick={() => approveEvent(event.eventId)}>
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminVerificationPage;
