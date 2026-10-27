import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AnnouncementsPage = () => {
  const { authToken, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.get('/announcements', authToken);
      setAnnouncements(Array.isArray(data) ? data : data?.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/announcements', newAnnouncement, authToken);
      if (data.success) {
        alert('Announcement created successfully!');
        setNewAnnouncement({ title: '', content: '' });
        setShowAddForm(false);
        loadAnnouncements();
      } else {
        alert(data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Announcements">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Announcements</h3>
          {(currentUser?.role === 'FACULTY' || currentUser?.role === 'ADMIN') && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Cancel' : 'Create Announcement'}
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={addAnnouncement} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">Create Announcement</button>
          </form>
        )}

        {announcements.length === 0 ? (
          <p>No announcements.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.announcementId} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <h4>{announcement.title}</h4>
              <p>{announcement.content}</p>
              <span className="notification-time">
                Published: {new Date(announcement.publishedAt).toLocaleString()} by {announcement.createdBy}
              </span>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnnouncementsPage;
