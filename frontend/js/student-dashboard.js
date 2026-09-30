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

  // Load dashboard data
  loadDashboardData();
});

function updateUserInterface(user) {
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const userAvatar = document.getElementById('user-avatar');

  if (userName) {
    userName.textContent = user.firstName || 'Student';
  }

  if (userEmail) {
    userEmail.textContent = user.email || 'student@example.com';
  }

  if (userAvatar) {
    const initial = (user.firstName && user.firstName[0]) || 'S';
    userAvatar.textContent = initial.toUpperCase();
  }
}

async function loadDashboardData() {
  try {
    // Load notifications
    await loadNotifications();
    
    // Load suggested alumni
    await loadSuggestedAlumni();
    
    // Load upcoming events
    await loadUpcomingEvents();
    
    // Load career opportunities
    await loadCareerOpportunities();
    
    // Load mentorship status
    await loadMentorshipStatus();
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadNotifications() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications`);
    
    if (response && response.ok) {
      const payload = await response.json();
      const notifications = Array.isArray(payload) ? payload : payload.notifications || [];
      renderNotifications(notifications);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function renderNotifications(notifications) {
  const notificationsList = document.getElementById('notifications-list');
  
  if (!notificationsList) return;

  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p>No new notifications.</p>';
    return;
  }

  notificationsList.innerHTML = notifications.map(notification => `
    <div class="notification-item ${notification.read ? '' : 'unread'}">
      <p>${notification.message}</p>
      <span class="notification-time">${formatDate(notification.createdAt || notification.created_at)}</span>
    </div>
  `).join('');
}

async function loadSuggestedAlumni() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/suggested`);
    
    if (response && response.ok) {
      const payload = await response.json();
      const alumni = Array.isArray(payload) ? payload : payload.alumni || [];
      renderSuggestedAlumni(alumni);
    }
  } catch (error) {
    console.error('Error loading suggested alumni:', error);
  }
}

function renderSuggestedAlumni(alumni) {
  const suggestedAlumniContainer = document.getElementById('suggested-alumni');
  
  if (!suggestedAlumniContainer) return;

  if (alumni.length === 0) {
    suggestedAlumniContainer.innerHTML = '<p>No suggested alumni available.</p>';
    return;
  }

  suggestedAlumniContainer.innerHTML = alumni.map(alum => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${alum.firstName || alum.first_name || ''} ${alum.lastName || alum.last_name || ''}</h4>
        <p>${alum.designation || 'Alumni'} @ ${alum.companyName || alum.company_name || 'Company'}</p>
        <p>${alum.departmentCode || alum.department_code || 'Department'} • ${alum.graduationYear || alum.graduation_year || 'Year'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="connectWithAlumni(${alum.alumniId || alum.alumni_id})">Connect</button>
      </div>
    </div>
  `).join('');
}

async function loadUpcomingEvents() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/upcoming`);
    
    if (response && response.ok) {
      const payload = await response.json();
      const events = Array.isArray(payload) ? payload : payload.events || [];
      renderUpcomingEvents(events);
    }
  } catch (error) {
    console.error('Error loading upcoming events:', error);
  }
}

function renderUpcomingEvents(events) {
  const eventsContainer = document.getElementById('upcoming-events');
  
  if (!eventsContainer) return;

  if (events.length === 0) {
    eventsContainer.innerHTML = '<p>No upcoming events.</p>';
    return;
  }

  eventsContainer.innerHTML = events.map(event => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${event.title}</h4>
        <p>${formatDate(event.eventDate || event.event_date)} • ${event.venue || 'TBD'}</p>
        <p>Type: ${event.type || 'General'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="registerForEvent(${event.eventId || event.event_id})">Register</button>
      </div>
    </div>
  `).join('');
}

async function loadCareerOpportunities() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/jobs/recent`);
    
    if (response && response.ok) {
      const payload = await response.json();
      const jobs = Array.isArray(payload) ? payload : payload.jobs || [];
      renderCareerOpportunities(jobs);
    }
  } catch (error) {
    console.error('Error loading career opportunities:', error);
  }
}

function renderCareerOpportunities(jobs) {
  const jobsContainer = document.getElementById('career-opportunities');
  
  if (!jobsContainer) return;

  if (jobs.length === 0) {
    jobsContainer.innerHTML = '<p>No recent job postings.</p>';
    return;
  }

  jobsContainer.innerHTML = jobs.map(job => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${job.title}</h4>
        <p>${job.companyName || job.company_name || 'Company'} • ${job.location || 'Location'}</p>
        <p>Deadline: ${formatDate(job.deadline)}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="applyForJob(${job.jobId || job.job_id})">Apply</button>
      </div>
    </div>
  `).join('');
}

async function loadMentorshipStatus() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/my-requests`);
    
    if (response && response.ok) {
      const payload = await response.json();
      const mentorships = Array.isArray(payload) ? payload : payload.requests || [];
      renderMentorshipStatus(mentorships);
    }
  } catch (error) {
    console.error('Error loading mentorship status:', error);
  }
}

function renderMentorshipStatus(mentorships) {
  const mentorshipContainer = document.getElementById('mentorship-status');
  
  if (!mentorshipContainer) return;

  const activeRequests = mentorships.filter(m => m.status === 'PENDING' || m.status === 'ACCEPTED');
  
  if (activeRequests.length === 0) {
    mentorshipContainer.innerHTML = `
      <p>No active mentorship requests.</p>
      <button class="btn btn-primary" onclick="window.location.href='mentorship.html'">Find a Mentor</button>
    `;
    return;
  }

  mentorshipContainer.innerHTML = activeRequests.map(mentorship => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${mentorship.mentorName || mentorship.mentor_name || 'Mentor'}</h4>
        <p>Status: ${mentorship.status}</p>
        <p>Area: ${mentorship.areaOfInterest || mentorship.area_of_interest || 'General'}</p>
      </div>
      <div class="list-item-actions">
        <span class="badge ${mentorship.status.toLowerCase()}">${mentorship.status}</span>
      </div>
    </div>
  `).join('');
}

// Action functions
async function connectWithAlumni(alumniId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/connections/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ alumni_id: alumniId })
    });

    if (response && response.ok) {
      alert('Connection request sent successfully!');
      // Reload suggested alumni
      await loadSuggestedAlumni();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to send connection request');
    }
  } catch (error) {
    console.error('Error sending connection request:', error);
    alert('Network error. Please try again.');
  }
}

async function registerForEvent(eventId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'POST'
    });

    if (response && response.ok) {
      alert('Event registration successful!');
      // Reload events
      await loadUpcomingEvents();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to register for event');
    }
  } catch (error) {
    console.error('Error registering for event:', error);
    alert('Network error. Please try again.');
  }
}

async function applyForJob(jobId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
      method: 'POST'
    });

    if (response && response.ok) {
      alert('Job application submitted successfully!');
      // Reload jobs
      await loadCareerOpportunities();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to apply for job');
    }
  } catch (error) {
    console.error('Error applying for job:', error);
    alert('Network error. Please try again.');
  }
}

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
}