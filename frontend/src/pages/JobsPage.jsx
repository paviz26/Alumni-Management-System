import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const JobsPage = () => {
  const { authToken, currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myPostings, setMyPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const [jobsData, applicationsData] = await Promise.all([
        api.get('/jobs', authToken),
        api.get('/jobs/my-applications', authToken),
      ]);

      setJobs(Array.isArray(jobsData) ? jobsData : jobsData?.jobs || []);
      setMyApplications(Array.isArray(applicationsData) ? applicationsData : applicationsData?.applications || []);

      if (currentUser?.role === 'ALUMNI') {
        const postingsData = await api.get('/jobs/my-postings', authToken);
        setMyPostings(Array.isArray(postingsData) ? postingsData : postingsData?.jobs || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyForJob = async (jobId) => {
    try {
      const data = await api.post(`/jobs/${jobId}/apply`, {}, authToken);
      if (data.success) {
        alert('Job application submitted successfully!');
        loadJobs();
      } else {
        alert(data.message || 'Failed to apply for job');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Network error. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
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
    <DashboardLayout title="Career Opportunities">
      <div className="dashboard-grid">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Available Jobs</h3>
          {jobs.length === 0 ? (
            <p>No job postings available.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.jobId} className="list-item">
                <div className="list-item-info">
                  <h4>{job.title}</h4>
                  <p>{job.companyName} • {job.location}</p>
                  <p>Type: {job.employmentType} • Deadline: {formatDate(job.deadline)}</p>
                </div>
                <div className="list-item-actions">
                  {!job.hasApplied && (
                    <button className="btn btn-primary" onClick={() => applyForJob(job.jobId)}>
                      Apply
                    </button>
                  )}
                  {job.hasApplied && <span className="verified-badge">Applied</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>My Applications</h3>
          {myApplications.length === 0 ? (
            <p>No job applications yet.</p>
          ) : (
            myApplications.map((application) => (
              <div key={application.applicationId} className="list-item">
                <div className="list-item-info">
                  <h4>{application.jobTitle}</h4>
                  <p>{application.companyName} • {application.location}</p>
                  <p>Status: {application.status}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {currentUser?.role === 'ALUMNI' && (
          <div className="card">
            <h3>My Postings</h3>
            {myPostings.length === 0 ? (
              <p>No job postings yet.</p>
            ) : (
              myPostings.map((job) => (
                <div key={job.jobId} className="list-item">
                  <div className="list-item-info">
                    <h4>{job.title}</h4>
                    <p>{job.companyName} • {job.location}</p>
                    <p>Applications: {job.applicationCount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobsPage;
