import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ProfilePage = () => {
  const { currentUser, authToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    jobTitle: '',
    location: '',
    bio: '',
    linkedinUrl: '',
    githubUrl: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileError('');
    try {
      const data = await api.get(`/alumni/me`, authToken);
      setProfile(data);
      setEditForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        company: data.companyName || '',
        jobTitle: data.designation || '',
        location: data.location || '',
        bio: data.bio || '',
        linkedinUrl: data.linkedinUrl || '',
        githubUrl: data.githubUrl || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.status === 404) {
        setProfileError('This profile page is available only to accounts with an alumni profile.');
      } else {
        setProfileError(error.message || 'Failed to load your profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      company: profile.companyName || '',
      jobTitle: profile.designation || '',
      location: profile.location || '',
      bio: profile.bio || '',
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = await api.put('/alumni/me', editForm, authToken);
      if (data.success) {
        alert('Profile updated successfully!');
        setEditing(false);
        loadProfile();
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.status === 403) {
        alert('You do not have permission to update this profile.');
      } else if (error.status === 404) {
        alert('Profile update is only available for alumni accounts.');
      } else {
        alert(error.message || 'Failed to update your profile.');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Profile Information</h3>
          {currentUser?.role === 'ALUMNI' && !editing && (
            <button className="btn btn-primary" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>
        {profile ? (
          editing ? (
            <form onSubmit={handleSave} style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="text"
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="jobTitle">Job Title</label>
                <input
                  type="text"
                  id="jobTitle"
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="linkedinUrl">LinkedIn URL</label>
                <input
                  type="url"
                  id="linkedinUrl"
                  value={editForm.linkedinUrl}
                  onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="githubUrl">GitHub URL</label>
                <input
                  type="url"
                  id="githubUrl"
                  value={editForm.githubUrl}
                  onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-success">Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
                <div className="profile-info">
                  <h2>{profile.firstName} {profile.lastName}</h2>
                  <div className="profile-title">{profile.designation}</div>
                  {profile.verified && <span className="verified-badge">Verified</span>}
                </div>
              </div>
              <div className="profile-section">
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
                <p><strong>Location:</strong> {profile.location || 'Not provided'}</p>
              </div>
              <div className="profile-section">
                <h4>Professional Information</h4>
                <p><strong>Company:</strong> {profile.companyName || 'Not provided'}</p>
                <p><strong>Designation:</strong> {profile.designation || 'Not provided'}</p>
                <p><strong>Department:</strong> {profile.departmentCode}</p>
                <p><strong>Graduation Year:</strong> {profile.graduationYear}</p>
              </div>
              <div className="profile-section">
                <h4>Bio</h4>
                <p>{profile.bio || 'No bio provided'}</p>
              </div>
              {(profile.linkedinUrl || profile.githubUrl) && (
                <div className="profile-section">
                  <h4>Social Links</h4>
                  {profile.linkedinUrl && <p><strong>LinkedIn:</strong> <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">{profile.linkedinUrl}</a></p>}
                  {profile.githubUrl && <p><strong>GitHub:</strong> <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">{profile.githubUrl}</a></p>}
                </div>
              )}
            </div>
          )
        ) : (
            <p role="status">{profileError || 'Profile not found.'}</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
