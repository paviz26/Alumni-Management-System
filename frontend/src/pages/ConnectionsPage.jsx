import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ConnectionsPage = () => {
  const { authToken } = useAuth();
  const [myConnections, setMyConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const [connectionsData, pendingData, sentData] = await Promise.all([
        api.get('/connections/my-connections', authToken),
        api.get('/connections/requests', authToken),
        api.get('/connections/sent-requests', authToken),
      ]);

      setMyConnections(Array.isArray(connectionsData) ? connectionsData : connectionsData?.connections || []);
      setPendingRequests(Array.isArray(pendingData) ? pendingData : pendingData?.requests || []);
      setSentRequests(Array.isArray(sentData) ? sentData : sentData?.requests || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (connectionId, status) => {
    try {
      const data = await api.put(`/connections/${connectionId}`, { status }, authToken);
      if (data.success) {
        alert(`Connection request ${status.toLowerCase()}!`);
        loadConnections();
      } else {
        alert(data.message || 'Failed to respond to request');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      alert(error.message || 'Failed to update connection request.');
    }
  };

  const cancelRequest = async (connectionId) => {
    try {
      const data = await api.delete(`/connections/${connectionId}`, authToken);
      if (data.success) {
        alert('Connection request cancelled!');
        loadConnections();
      } else {
        alert(data.message || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert(error.message || 'Failed to cancel connection request.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Connections">
      <div className="dashboard-grid">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>My Connections</h3>
          {myConnections.length === 0 ? (
            <p>No connections yet.</p>
          ) : (
            myConnections.map((connection) => (
              <div key={connection.alumniId} className="list-item">
                <div className="list-item-info">
                  <h4>{connection.name}</h4>
                  <p>{connection.title} • {connection.department}</p>
                  <p>Graduated: {connection.graduationYear}</p>
                  <p>Connected: {new Date(connection.connectedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Pending Requests</h3>
          {pendingRequests.length === 0 ? (
            <p>No pending requests.</p>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.connectionId} className="list-item">
                <div className="list-item-info">
                  <h4>{request.requesterName}</h4>
                  <p>{request.requesterTitle} • {request.requesterDepartment}</p>
                  <p>Year: {request.requesterYear}</p>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-success" onClick={() => respondToRequest(request.connectionId, 'ACCEPTED')}>
                    Accept
                  </button>
                  <button className="btn btn-secondary" onClick={() => respondToRequest(request.connectionId, 'REJECTED')}>
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Sent Requests</h3>
          {sentRequests.length === 0 ? (
            <p>No sent requests.</p>
          ) : (
            sentRequests.map((request) => (
              <div key={request.connectionId} className="list-item">
                <div className="list-item-info">
                  <h4>{request.recipientName}</h4>
                  <p>{request.recipientTitle}</p>
                  <p>Status: {request.status}</p>
                </div>
                <div className="list-item-actions">
                  {request.status === 'PENDING' && (
                    <button className="btn btn-secondary" onClick={() => cancelRequest(request.connectionId)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConnectionsPage;
