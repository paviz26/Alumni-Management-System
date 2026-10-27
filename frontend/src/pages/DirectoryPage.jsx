import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DirectoryPage = () => {
  const { authToken } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      const data = await api.get('/alumni', authToken);
      setAlumni(Array.isArray(data) ? data : data?.alumni || []);
    } catch (error) {
      console.error('Error loading alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Alumni Directory">
      <div className="card">
        <h3>All Alumni</h3>
        <div className="search-bar">
          <input type="text" placeholder="Search alumni..." />
          <button>Search</button>
        </div>
        {alumni.length === 0 ? (
          <p>No alumni found.</p>
        ) : (
          alumni.map((alum) => (
            <div key={alum.alumniId} className="list-item">
              <div className="list-item-info">
                <h4>{alum.firstName} {alum.lastName}</h4>
                <p>{alum.designation} @ {alum.companyName}</p>
                <p>{alum.departmentCode} • {alum.graduationYear}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default DirectoryPage;
