import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ProfilePage = () => {
  const { currentUser, authToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get(`/alumni/me`, authToken);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="card">
        <h3>Profile Information</h3>
        {profile ? (
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
          </div>
        ) : (
          <p>Profile not found.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
