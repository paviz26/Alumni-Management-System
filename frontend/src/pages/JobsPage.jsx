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
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    employmentType: 'Full-time',
    deadline: '',
    applicationUrl: '',
  });

  const safeApplicationUrl = (value) => {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setErrorMessage('');
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
      setErrorMessage(error.message || 'Failed to load job postings.');
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
      if (error.status === 409) {
        alert('You have already applied for this job.');
      } else {
        alert(error.message || 'Failed to record job application.');
      }
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/jobs', jobForm, authToken);
      if (data.success) {
        alert('Job posting created successfully!');
        setJobForm({
          title: '',
          description: '',
          company: '',
          location: '',
          employmentType: 'Full-time',
          deadline: '',
          applicationUrl: '',
        });
        setShowAddForm(false);
        loadJobs();
      } else {
        alert(data.message || 'Failed to create job posting');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      alert(error.message || 'Failed to create job posting.');
    }
  };

  const updateJob = async (e) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      const data = await api.put(`/jobs/${editingJob.jobId}`, jobForm, authToken);
      if (data.success) {
        alert('Job posting updated successfully!');
        setEditingJob(null);
        setJobForm({
          title: '',
          description: '',
          company: '',
          location: '',
          employmentType: 'Full-time',
          deadline: '',
          applicationUrl: '',
        });
        loadJobs();
      } else {
        alert(data.message || 'Failed to update job posting');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      if (error.status === 403) {
        alert('You do not have permission to update this job posting.');
      } else {
        alert(error.message || 'Failed to update job posting.');
      }
    }
  };

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      const data = await api.delete(`/jobs/${jobId}`, authToken);
      if (data.success) {
        alert('Job posting deleted successfully!');
        loadJobs();
      } else {
        alert(data.message || 'Failed to delete job posting');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      if (error.status === 403) {
        alert('You do not have permission to delete this job posting.');
      } else {
        alert(error.message || 'Failed to delete job posting.');
      }
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      description: job.description || '',
      company: job.companyName,
      location: job.location,
      employmentType: job.employmentType,
      deadline: job.deadline,
      applicationUrl: job.applicationUrl || '',
    });
    setShowAddForm(true);
  };

  const isExpired = (deadline) => {
    if (!deadline) return false;
    return deadline < new Date().toISOString().slice(0, 10);
  };

  const handleCancel = () => {
    setEditingJob(null);
    setShowAddForm(false);
    setJobForm({
      title: '',
      description: '',
      company: '',
      location: '',
      employmentType: 'Full-time',
      deadline: '',
      applicationUrl: '',
    });
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
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Available Jobs</h3>
            {currentUser?.role === 'ALUMNI' && (
              <button className="btn btn-primary" onClick={showAddForm ? handleCancel : () => setShowAddForm(true)}>
                {showAddForm ? 'Cancel' : 'Post a Job'}
              </button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={editingJob ? updateJob : createJob} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  value={jobForm.company}
                  onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="employmentType">Employment Type</label>
                <select
                  id="employmentType"
                  value={jobForm.employmentType}
                  onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  value={jobForm.deadline}
                  onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="applicationUrl">Application URL (optional)</label>
                <input
                  type="url"
                  id="applicationUrl"
                  value={jobForm.applicationUrl}
                  onChange={(e) => setJobForm({ ...jobForm, applicationUrl: e.target.value })}
                  placeholder="https://example.com/apply"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-success">
                  {editingJob ? 'Update Job' : 'Post Job'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {jobs.length === 0 ? (
            <p>No job postings available.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.jobId} className="list-item">
                <div className="list-item-info">
                  <h4>{job.title}</h4>
                  <p>{job.companyName} • {job.location}</p>
                  <p>Type: {job.employmentType} • Deadline: {formatDate(job.deadline)}</p>
                  {safeApplicationUrl(job.applicationUrl) && (
                    <p>
                      <a href={safeApplicationUrl(job.applicationUrl)} target="_blank" rel="noopener noreferrer">
                        Employer application site
                      </a>
                    </p>
                  )}
                </div>
                <div className="list-item-actions">
                  {currentUser?.role === 'STUDENT' && !job.hasApplied && !isExpired(job.deadline) && (
                    <button className="btn btn-primary" onClick={() => applyForJob(job.jobId)}>
                      Record application
                    </button>
                  )}
                  {job.hasApplied && <span className="verified-badge">Applied</span>}
                  {currentUser?.role === 'STUDENT' && isExpired(job.deadline) && (
                    <span style={{ color: '#6b7280' }}>Expired</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {currentUser?.role === 'STUDENT' && (
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
        )}

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
                  <div className="list-item-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(jobs.find((listedJob) => listedJob.jobId === job.jobId) || job)}
                    >
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteJob(job.jobId)}>
                      Delete
                    </button>
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
