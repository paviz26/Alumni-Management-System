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
  const userAvatar = document.getElementById('user-avatar');
  const profileAvatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-name');
  const profileTitle = document.getElementById('profile-title');
  const profileDept = document.getElementById('profile-dept');
  const profileLocation = document.getElementById('profile-location');
  const verifiedBadge = document.getElementById('verified-badge');

  if (userName) {
    userName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Alumni';
  }

  if (userAvatar && profileAvatar) {
    const initial = (user.firstName && user.firstName[0]) || 'A';
    userAvatar.textContent = initial.toUpperCase();
    profileAvatar.textContent = initial.toUpperCase();
  }

  if (profileName) {
    profileName.innerHTML = `${user.firstName || ''} ${user.lastName || ''}`.trim() + 
      (user.verified ? '<span class="verified-badge">✓ Verified</span>' : '');
  }

  if (profileTitle) {
    profileTitle.textContent = `${user.designation || 'Alumni'} @ ${user.company || 'Company'}`;
  }

  if (profileDept) {
    profileDept.textContent = `${user.department || 'Department'} • ${user.graduationYear || 'Year'}`;
  }

  if (profileLocation) {
    profileLocation.textContent = user.location || 'Location not specified';
  }

  if (verifiedBadge && user.verified) {
    verifiedBadge.style.display = 'inline-block';
  }
}

async function loadDashboardData() {
  try {
    // Load all dashboard data in parallel
    await Promise.all([
      loadProfileStats(),
      loadMentorshipRequests(),
      loadConnectionRequests(),
      loadRecentAchievements(),
      loadUpcomingEvents(),
      loadMyPostedJobs()
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadProfileStats() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/stats`);
    
    if (response && response.ok) {
      const stats = await response.json();
      updateProfileStats(stats);
    }
  } catch (error) {
    console.error('Error loading profile stats:', error);
  }
}

function updateProfileStats(stats) {
  const connectionsCount = document.getElementById('connections-count');
  const mentorshipCount = document.getElementById('mentorship-count');

  if (connectionsCount) {
    connectionsCount.textContent = stats.connections || 0;
  }

  if (mentorshipCount) {
    mentorshipCount.textContent = stats.mentorshipRequests || 0;
  }
}

async function loadMentorshipRequests() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/requests`);
    
    if (response && response.ok) {
      const requests = await response.json();
      renderMentorshipRequests(requests);
    }
  } catch (error) {
    console.error('Error loading mentorship requests:', error);
  }
}

function renderMentorshipRequests(requests) {
  const container = document.getElementById('mentorship-requests');
  
  if (!container) return;

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  
  if (pendingRequests.length === 0) {
    container.innerHTML = '<p>No pending mentorship requests.</p>';
    return;
  }

  container.innerHTML = pendingRequests.map(request => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${request.mentee_name}</h4>
        <p>Area: ${request.area_of_interest || 'General'}</p>
        <p>Message: ${request.message || 'No message'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-success" onclick="respondToMentorship(${request.mentorship_id}, 'ACCEPTED')">Accept</button>
        <button class="btn btn-secondary" onclick="respondToMentorship(${request.mentorship_id}, 'REJECTED')">Reject</button>
      </div>
    </div>
  `).join('');
}

async function loadConnectionRequests() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/connections/requests`);
    
    if (response && response.ok) {
      const requests = await response.json();
      renderConnectionRequests(requests);
    }
  } catch (error) {
    console.error('Error loading connection requests:', error);
  }
}

function renderConnectionRequests(requests) {
  const container = document.getElementById('connection-requests');
  
  if (!container) return;

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  
  if (pendingRequests.length === 0) {
    container.innerHTML = '<p>No pending connection requests.</p>';
    return;
  }

  container.innerHTML = pendingRequests.map(request => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${request.requester_name}</h4>
        <p>${request.requester_title || 'Student/Alumni'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-success" onclick="respondToConnection(${request.connection_id}, 'ACCEPTED')">Accept</button>
        <button class="btn btn-secondary" onclick="respondToConnection(${request.connection_id}, 'REJECTED')">Reject</button>
      </div>
    </div>
  `).join('');
}

async function loadRecentAchievements() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/achievements`);
    
    if (response && response.ok) {
      const achievements = await response.json();
      renderRecentAchievements(achievements);
    }
  } catch (error) {
    console.error('Error loading achievements:', error);
  }
}

function renderRecentAchievements(achievements) {
  const container = document.getElementById('recent-achievements');
  
  if (!container) return;

  if (achievements.length === 0) {
    container.innerHTML = '<p>No achievements added yet.</p>';
    return;
  }

  container.innerHTML = achievements.slice(0, 3).map(achievement => `
    <div class="achievement-item">
      <div class="achievement-header">
        <span class="achievement-icon">🏆</span>
        <span class="achievement-title">${achievement.title}</span>
      </div>
      <p class="achievement-description">${achievement.description || 'No description'}</p>
      <p class="achievement-date">${formatDate(achievement.achievement_date)}</p>
    </div>
  `).join('');
}

async function loadUpcomingEvents() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/upcoming`);
    
    if (response && response.ok) {
      const events = await response.json();
      renderUpcomingEvents(events);
    }
  } catch (error) {
    console.error('Error loading upcoming events:', error);
  }
}

function renderUpcomingEvents(events) {
  const container = document.getElementById('upcoming-events');
  
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = '<p>No upcoming events.</p>';
    return;
  }

  container.innerHTML = events.slice(0, 3).map(event => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${event.title}</h4>
        <p>${formatDate(event.event_date)} • ${event.venue || 'TBD'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewEventDetails(${event.event_id})">View Details</button>
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
    console.error('Error loading posted jobs:', error);
  }
}

function renderMyPostedJobs(jobs) {
  const container = document.getElementById('my-jobs');
  
  if (!container) return;

  if (jobs.length === 0) {
    container.innerHTML = `
      <p>No opportunities posted yet.</p>
      <button class="btn btn-primary" onclick="window.location.href='jobs.html'">Post Opportunity</button>
    `;
    return;
  }

  container.innerHTML = jobs.slice(0, 3).map(job => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${job.title}</h4>
        <p>${job.company_name || 'Company'} • ${job.location || 'Location'}</p>
        <p>Applications: ${job.application_count || 0}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewJobDetails(${job.job_id})">View Details</button>
      </div>
    </div>
  `).join('');
}

// Action functions
async function respondToMentorship(mentorshipId, action) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/${mentorshipId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: action })
    });

    if (response && response.ok) {
      alert(`Mentorship request ${action.toLowerCase()}!`);
      await loadMentorshipRequests();
      await loadProfileStats();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to respond to mentorship request');
    }
  } catch (error) {
    console.error('Error responding to mentorship:', error);
    alert('Network error. Please try again.');
  }
}

async function respondToConnection(connectionId, action) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/connections/${connectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: action })
    });

    if (response && response.ok) {
      alert(`Connection request ${action.toLowerCase()}!`);
      await loadConnectionRequests();
      await loadProfileStats();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to respond to connection request');
    }
  } catch (error) {
    console.error('Error responding to connection:', error);
    alert('Network error. Please try again.');
  }
}

function editProfile() {
  window.location.href = 'profile.html?edit=true';
}

function viewEventDetails(eventId) {
  window.location.href = `events.html?id=${eventId}`;
}

function viewJobDetails(jobId) {
  window.location.href = `jobs.html?id=${jobId}`;
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