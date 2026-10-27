import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AchievementsPage = () => {
  const { authToken } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    achievementDate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await api.get('/alumni/achievements', authToken);
      setAchievements(Array.isArray(data) ? data : data?.achievements || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAchievement = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/alumni/achievements', newAchievement, authToken);
      if (data.success) {
        alert('Achievement added successfully!');
        setNewAchievement({ title: '', description: '', achievementDate: '' });
        setShowAddForm(false);
        loadAchievements();
      } else {
        alert(data.message || 'Failed to add achievement');
      }
    } catch (error) {
      console.error('Error adding achievement:', error);
      alert('Network error. Please try again.');
    }
  };

  const deleteAchievement = async (achievementId) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      const data = await api.delete(`/alumni/achievements/${achievementId}`, authToken);
      if (data.success) {
        alert('Achievement deleted successfully!');
        loadAchievements();
      } else {
        alert(data.message || 'Failed to delete achievement');
      }
    } catch (error) {
      console.error('Error deleting achievement:', error);
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Achievements">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>My Achievements</h3>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add Achievement'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={addAchievement} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={newAchievement.description}
                onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="achievementDate">Date</label>
              <input
                type="date"
                id="achievementDate"
                value={newAchievement.achievementDate}
                onChange={(e) => setNewAchievement({ ...newAchievement, achievementDate: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">Add Achievement</button>
          </form>
        )}

        {achievements.length === 0 ? (
          <p>No achievements yet.</p>
        ) : (
          achievements.map((achievement) => (
            <div key={achievement.achievementId} className="achievement-item">
              <div className="achievement-header">
                <span className="achievement-icon">🏆</span>
                <span className="achievement-title">{achievement.title}</span>
              </div>
              <p className="achievement-description">{achievement.description}</p>
              <p className="achievement-date">{new Date(achievement.achievementDate).toLocaleDateString()}</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.85rem' }}
                onClick={() => deleteAchievement(achievement.achievementId)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default AchievementsPage;
