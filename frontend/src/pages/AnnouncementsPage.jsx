import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AnnouncementsPage = () => {
  const { authToken, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setErrorMessage('');
    try {
      const data = await api.get('/announcements', authToken);
      setAnnouncements(Array.isArray(data) ? data : data?.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setErrorMessage(error.message || 'Failed to load announcements.');
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
      alert(error.message || 'Failed to create announcement.');
    }
  };

  const updateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncement) return;

    try {
      const data = await api.put(`/announcements/${editingAnnouncement.announcementId}`, newAnnouncement, authToken);
      if (data.success) {
        alert('Announcement updated successfully!');
        setEditingAnnouncement(null);
        setNewAnnouncement({ title: '', content: '' });
        setShowAddForm(false);
        loadAnnouncements();
      } else {
        alert(data.message || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      if (error.status === 403) {
        alert('You do not have permission to update this announcement.');
      } else {
        alert(error.message || 'Failed to update announcement.');
      }
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const data = await api.delete(`/announcements/${announcementId}`, authToken);
      if (data.success) {
        alert('Announcement deleted successfully!');
        loadAnnouncements();
      } else {
        alert(data.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      if (error.status === 403) {
        alert('You do not have permission to delete this announcement.');
      } else {
        alert(error.message || 'Failed to delete announcement.');
      }
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingAnnouncement(null);
    setNewAnnouncement({ title: '', content: '' });
    setShowAddForm(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Announcements">
      <div className="card">
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Announcements</h3>
          {(currentUser?.role === 'ADMIN' || (currentUser?.role === 'FACULTY' && announcement.isCreator)) && (
            <button className="btn btn-primary" onClick={showAddForm ? handleCancel : () => setShowAddForm(true)}>
              {showAddForm ? 'Cancel' : 'Create Announcement'}
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={editingAnnouncement ? updateAnnouncement : addAnnouncement} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-success">
                {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {announcements.length === 0 ? (
          <p>No announcements.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.announcementId} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4>{announcement.title}</h4>
                  <p>{announcement.content}</p>
                  <span className="notification-time">
                    Published: {new Date(announcement.publishedAt).toLocaleString()}
                  </span>
                </div>
                {(currentUser?.role === 'FACULTY' || currentUser?.role === 'ADMIN') && (
                  <div className="list-item-actions" style={{ marginLeft: '20px' }}>
                    <button className="btn btn-secondary" onClick={() => handleEdit(announcement)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteAnnouncement(announcement.announcementId)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnnouncementsPage;
