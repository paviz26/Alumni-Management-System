import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DonationPage = () => {
  const { authToken, currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [donationForm, setDonationForm] = useState({
    amount: '',
    purpose: '',
  });

  useEffect(() => {
    loadDonations();
    if (currentUser?.role === 'ADMIN') {
      loadSummary();
    }
  }, []);

  const loadDonations = async () => {
    setErrorMessage('');
    try {
      const endpoint = currentUser?.role === 'ADMIN' ? '/donations' : '/donations/me';
      const data = await api.get(endpoint, authToken);
      setDonations(Array.isArray(data) ? data : data?.donations || []);
    } catch (error) {
      console.error('Error loading donations:', error);
      setErrorMessage(error.message || 'Failed to load donation records.');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await api.get('/donations/summary', authToken);
      setSummary(data);
    } catch (error) {
      console.error('Error loading donation summary:', error);
      setErrorMessage(error.message || 'Failed to load donation summary.');
    }
  };

  const createDonation = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/donations', donationForm, authToken);
      if (data.success) {
        alert('Donation pledge recorded successfully!');
        setDonationForm({ amount: '', purpose: '' });
        setShowAddForm(false);
        loadDonations();
        if (currentUser?.role === 'ADMIN') {
          loadSummary();
        }
      } else {
        alert(data.message || 'Failed to record donation');
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      alert(error.message || 'Failed to record donation pledge.');
    }
  };

  const updateDonationStatus = async (donationId, status) => {
    if (!confirm(`Are you sure you want to mark this donation as ${status}?`)) return;

    try {
      const data = await api.put(`/donations/${donationId}/status`, { payment_status: status }, authToken);
      if (data.success) {
        alert(`Donation marked as ${status}!`);
        loadDonations();
        loadSummary();
      } else {
        alert(data.message || 'Failed to update donation status');
      }
    } catch (error) {
      console.error('Error updating donation status:', error);
      alert(error.message || 'Failed to update donation status.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
    <DashboardLayout title="Donations">
      <div className="dashboard-grid">
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        {currentUser?.role === 'ADMIN' && summary && (
          <div className="card">
            <h3>Donation Record Summary</h3>
            <div className="stat-card">
              <div className="stat-number">{summary.completedTotal || 0}</div>
              <div className="stat-label">Completed record total</div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Completed records:</strong> {summary.completedCount || 0}</p>
            </div>
          </div>
        )}

        <div className="card" style={{ gridColumn: currentUser?.role === 'ADMIN' ? 'span 2' : 'span 3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{currentUser?.role === 'ADMIN' ? 'All Donation Records' : 'My Donation Pledges'}</h3>
            {currentUser?.role === 'ALUMNI' && (
              <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Cancel' : 'Record Donation'}
              </button>
            )}
          </div>

          <p>These are pledge records only. A status marked completed does not confirm that a payment was processed.</p>

          {showAddForm && currentUser?.role === 'ALUMNI' && (
            <form onSubmit={createDonation} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="purpose">Purpose (optional)</label>
                <input
                  type="text"
                  id="purpose"
                  value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}
                  placeholder="e.g., Alumni fund, Scholarship"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-success">Record Pledge</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {donations.length === 0 ? (
            <p>No donation records found.</p>
          ) : (
            donations.map((donation) => (
              <div key={donation.donationId} className="list-item">
                <div className="list-item-info">
                  <h4>{donation.amount}</h4>
                  <p>Purpose: {donation.purpose || 'Not specified'}</p>
                  <p>Date: {formatDate(donation.donationDate)}</p>
                  <p>Status: <span style={{
                    color: donation.paymentStatus === 'COMPLETED' ? '#10b981' : donation.paymentStatus === 'FAILED' ? '#dc2626' : '#f59e0b',
                    fontWeight: '600'
                  }}>{donation.paymentStatus}</span></p>
                </div>
                <div className="list-item-actions">
                  {currentUser?.role === 'ADMIN' && donation.paymentStatus === 'PENDING' && (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => updateDonationStatus(donation.donationId, 'COMPLETED')}
                      >
                        Mark Complete
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => updateDonationStatus(donation.donationId, 'FAILED')}
                      >
                        Mark Failed
                      </button>
                    </>
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

export default DonationPage;
