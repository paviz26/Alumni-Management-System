import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminVerificationPage = () => {
  const { authToken } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerifications();
  }, [filter]);

  const loadVerifications = async () => {
    try {
      const endpoint = filter === 'ALL' ? '/admin/alumni-verification' : `/admin/alumni-verification?status=${filter}`;
      const data = await api.get(endpoint, authToken);
      setVerifications(Array.isArray(data) ? data : data?.verifications || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
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
      alert('Network error. Please try again.');
    }
  };

  const rejectAlumni = async (alumniId) => {
    const reason = prompt('Enter reason for rejection:');

    if (!reason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      const data = await api.put(`/admin/reject-alumni/${alumniId}`, { reason }, authToken);
      if (data.success) {
        alert('Alumni verification rejected!');
        loadVerifications();
      } else {
        alert(data.message || 'Failed to reject alumni');
      }
    } catch (error) {
      console.error('Error rejecting alumni:', error);
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Alumni Verification">
      <div className="card">
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
    </DashboardLayout>
  );
};

export default AdminVerificationPage;
