import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DirectoryPage = () => {
  const { authToken } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    department: '',
    graduationYear: '',
    field: '',
    company: '',
    location: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [appliedSearchParams, setAppliedSearchParams] = useState(searchParams);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadAlumni(page, appliedSearchParams);
  }, [page, appliedSearchParams]);

  const loadAlumni = async (requestedPage, filters) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.department) params.append('department', filters.department);
      if (filters.graduationYear) params.append('graduationYear', filters.graduationYear);
      if (filters.field) params.append('field', filters.field);
      if (filters.company) params.append('company', filters.company);
      if (filters.location) params.append('location', filters.location);
      params.append('page', requestedPage);
      params.append('limit', limit);

      const data = await api.get(`/alumni/search?${params.toString()}`, authToken);
      setAlumni(Array.isArray(data) ? data : data?.alumni || []);
      setPagination({
        currentPage: data?.currentPage || requestedPage,
        totalPages: data?.totalPages || 1,
        totalItems: data?.totalItems || 0,
      });
    } catch (error) {
      console.error('Error loading alumni:', error);
      setErrorMessage(error.message || 'Failed to load alumni directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearchParams({ ...searchParams });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const clearSearch = () => {
    const emptyFilters = {
      keyword: '',
      department: '',
      graduationYear: '',
      field: '',
      company: '',
      location: '',
    };
    setSearchParams(emptyFilters);
    setAppliedSearchParams(emptyFilters);
    setPage(1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Alumni Directory">
      <div className="card">
        <h3>Alumni Directory</h3>
        <form onSubmit={handleSearch} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div className="form-group">
            <label htmlFor="keyword">Keyword</label>
            <input
              type="text"
              id="keyword"
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              placeholder="Search by name, company, etc."
            />
          </div>
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              value={searchParams.department}
              onChange={(e) => setSearchParams({ ...searchParams, department: e.target.value })}
              placeholder="e.g., CSE, ECE, Computer Science"
            />
          </div>
          <div className="form-group">
            <label htmlFor="graduationYear">Graduation Year</label>
            <input
              type="text"
              id="graduationYear"
              value={searchParams.graduationYear}
              onChange={(e) => setSearchParams({ ...searchParams, graduationYear: e.target.value })}
              placeholder="e.g., 2020"
            />
          </div>
          <div className="form-group">
            <label htmlFor="field">Field</label>
            <input
              type="text"
              id="field"
              value={searchParams.field}
              onChange={(e) => setSearchParams({ ...searchParams, field: e.target.value })}
              placeholder="e.g., Software Engineering"
            />
          </div>
          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              value={searchParams.company}
              onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
              placeholder="e.g., Google, Microsoft"
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={searchParams.location}
              onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
              placeholder="e.g., Bangalore, New York"
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearSearch}
            style={{ marginLeft: '10px' }}
          >
            Clear
          </button>
        </form>

        {errorMessage ? (
          <p className="error-message" role="alert">{errorMessage}</p>
        ) : loading ? (
          <p>Loading...</p>
        ) : alumni.length === 0 ? (
          <p>No alumni found.</p>
        ) : (
          <>
            <p style={{ marginBottom: '10px' }}>
              Showing {alumni.length} of {pagination.totalItems} alumni (Page {pagination.currentPage} of {pagination.totalPages})
            </p>
            {alumni.map((alum) => (
              <div key={alum.alumniId} className="list-item">
                <div className="list-item-info">
                  <h4>{alum.firstName} {alum.lastName}</h4>
                  <p>{alum.designation} @ {alum.companyName}</p>
                  <p>{alum.departmentCode} • {alum.graduationYear}</p>
                  {alum.location && <p>Location: {alum.location}</p>}
                </div>
              </div>
            ))}
            {pagination.totalPages > 1 && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DirectoryPage;
