const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = getCurrentUser();
  
  // Update user information in the UI
  updateUserInterface(currentUser);

  // Show post job card for alumni
  if (currentUser.role === 'ALUMNI') {
    document.getElementById('post-job-card').style.display = 'block';
    document.getElementById('my-posted-jobs-card').style.display = 'block';
  }

  // Load jobs data
  loadJobsData();

  // Setup post job form
  setupPostJobForm();
});

function updateUserInterface(user) {
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');

  if (userName) {
    userName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  }

  if (userAvatar) {
    const initial = (user.firstName && user.firstName[0]) || 'U';
    userAvatar.textContent = initial.toUpperCase();
  }
}

function goToDashboard() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    switch(currentUser.role) {
      case 'STUDENT':
        window.location.href = 'student-dashboard.html';
        break;
      case 'ALUMNI':
        window.location.href = 'alumni-dashboard.html';
        break;
      case 'FACULTY':
        window.location.href = 'faculty-dashboard.html';
        break;
      case 'ADMIN':
        window.location.href = 'admin-dashboard.html';
        break;
      default:
        window.location.href = '../index.html';
    }
  }
}

async function loadJobsData() {
  try {
    // Load all jobs data in parallel
    await Promise.all([
      loadAvailableJobs(),
      loadMyApplications(),
      loadMyPostedJobs()
    ]);
  } catch (error) {
    console.error('Error loading jobs data:', error);
  }
}

async function loadAvailableJobs() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/jobs`);
    
    if (response && response.ok) {
      const jobs = await response.json();
      renderAvailableJobs(jobs);
    }
  } catch (error) {
    console.error('Error loading available jobs:', error);
  }
}

function renderAvailableJobs(jobs) {
  const container = document.getElementById('available-jobs');
  
  if (!container) return;

  if (jobs.length === 0) {
    container.innerHTML = '<p>No career opportunities available.</p>';
    return;
  }

  container.innerHTML = jobs.map(job => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${job.title}</h4>
        <p>${job.company_name || 'Company'} • ${job.location || 'Location'}</p>
        <p>Type: ${job.employment_type || 'Full-time'} | Deadline: ${formatDate(job.deadline)}</p>
        <p>Posted by: ${job.poster_name || 'Alumni'}</p>
        ${job.description ? `<p style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">${job.description.substring(0, 100)}...</p>` : ''}
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewJobDetails(${job.job_id})">View Details</button>
        ${!job.has_applied ? `<button class="btn btn-success" onclick="applyForJob(${job.job_id})">Apply</button>` : `<button class="btn btn-secondary" disabled>Applied</button>`}
      </div>
    </div>
  `).join('');
}

async function loadMyApplications() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/jobs/my-applications`);
    
    if (response && response.ok) {
      const applications = await response.json();
      renderMyApplications(applications);
    }
  } catch (error) {
    console.error('Error loading my applications:', error);
  }
}

function renderMyApplications(applications) {
  const container = document.getElementById('my-applications');
  
  if (!container) return;

  if (applications.length === 0) {
    container.innerHTML = '<p>No job applications submitted yet.</p>';
    return;
  }

  container.innerHTML = applications.map(application => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${application.job_title}</h4>
        <p>${application.company_name || 'Company'} • ${application.location || 'Location'}</p>
        <p>Applied: ${formatDate(application.applied_at)}</p>
        <p>Status: <span class="badge ${application.status.toLowerCase()}">${application.status}</span></p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewJobDetails(${application.job_id})">View Details</button>
      </div>
    </div>
  `).join('');
}

async function loadMyPostedJobs() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/jobs/my-postings`);
    
    if (response && response.ok) {
      const jobs = await response.json();
      renderMyPostedJobs(jobs);
    }
  } catch (error) {
    console.error('Error loading my posted jobs:', error);
  }
}

function renderMyPostedJobs(jobs) {
  const container = document.getElementById('my-posted-jobs');
  
  if (!container) return;

  if (jobs.length === 0) {
    container.innerHTML = '<p>No opportunities posted yet.</p>';
    return;
  }

  container.innerHTML = jobs.map(job => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${job.title}</h4>
        <p>${job.company_name || 'Company'} • ${job.location || 'Location'}</p>
        <p>Type: ${job.employment_type || 'Full-time'} | Deadline: ${formatDate(job.deadline)}</p>
        <p>Applications: ${job.application_count || 0}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewJobDetails(${job.job_id})">View Details</button>
        <button class="btn btn-secondary" onclick="editJob(${job.job_id})">Edit</button>
        <button class="btn btn-secondary" onclick="deleteJob(${job.job_id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function setupPostJobForm() {
  const postJobForm = document.getElementById('post-job-form');
  
  if (postJobForm) {
    postJobForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const jobData = {
        title: document.getElementById('job-title').value,
        description: document.getElementById('job-description').value,
        company: document.getElementById('job-company').value,
        location: document.getElementById('job-location').value,
        employmentType: document.getElementById('job-type').value,
        deadline: document.getElementById('job-deadline').value,
        applicationUrl: document.getElementById('job-url').value
      };

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jobData)
        });

        if (response && response.ok) {
          alert('Career opportunity posted successfully!');
          // Clear form
          postJobForm.reset();
          // Reload jobs
          await loadJobsData();
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to post opportunity');
        }
      } catch (error) {
        console.error('Error posting job:', error);
        alert('Network error. Please try again.');
      }
    });
  }
}

// Action functions
async function applyForJob(jobId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
      method: 'POST'
    });

    if (response && response.ok) {
      alert('Job application submitted successfully!');
      await loadJobsData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to apply for job');
    }
  } catch (error) {
    console.error('Error applying for job:', error);
    alert('Network error. Please try again.');
  }
}

async function editJob(jobId) {
  // This would open an edit form for the job
  alert(`Edit job ${jobId} - Full edit functionality coming soon!`);
}

async function deleteJob(jobId) {
  if (!confirm('Are you sure you want to delete this job posting?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE'
    });

    if (response && response.ok) {
      alert('Job posting deleted successfully!');
      await loadJobsData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to delete job posting');
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    alert('Network error. Please try again.');
  }
}

function viewJobDetails(jobId) {
  // This would open a detailed job view
  alert(`Job details for job ID: ${jobId} - Full job details view coming soon!`);
}

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return 'No deadline';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}