const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = getCurrentUser();
  
  // Check if user is admin
  if (currentUser.role !== 'ADMIN') {
    alert('Admin dashboard is only accessible to administrators');
    window.location.href = '../index.html';
    return;
  }
  
  // Update user information in the UI
  updateUserInterface(currentUser);

  // Load admin dashboard data
  loadAdminDashboardData();
});

function updateUserInterface(user) {
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');

  if (userName) {
    userName.textContent = 'Admin';
  }

  if (userAvatar) {
    userAvatar.textContent = 'A';
  }
}

async function loadAdminDashboardData() {
  try {
    // Load all admin dashboard data in parallel
    await Promise.all([
      loadSystemStatistics(),
      loadPendingVerifications(),
      loadPendingEvents(),
      loadRecentActivity()
    ]);
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);
  }
}

async function loadSystemStatistics() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/statistics`);
    
    if (response && response.ok) {
      const stats = await response.json();
      updateSystemStatistics(stats);
    }
  } catch (error) {
    console.error('Error loading system statistics:', error);
  }
}

function updateSystemStatistics(stats) {
  const totalUsers = document.getElementById('total-users');
  const totalAlumni = document.getElementById('total-alumni');
  const totalStudents = document.getElementById('total-students');
  const totalFaculty = document.getElementById('total-faculty');
  const totalEvents = document.getElementById('total-events');
  const totalMentorships = document.getElementById('total-mentorships');

  if (totalUsers) totalUsers.textContent = stats.totalUsers || 0;
  if (totalAlumni) totalAlumni.textContent = stats.totalAlumni || 0;
  if (totalStudents) totalStudents.textContent = stats.totalStudents || 0;
  if (totalFaculty) totalFaculty.textContent = stats.totalFaculty || 0;
  if (totalEvents) totalEvents.textContent = stats.totalEvents || 0;
  if (totalMentorships) totalMentorships.textContent = stats.totalMentorships || 0;
}

async function loadPendingVerifications() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/pending-verifications`);
    
    if (response && response.ok) {
      const verifications = await response.json();
      renderPendingVerifications(verifications);
    }
  } catch (error) {
    console.error('Error loading pending verifications:', error);
  }
}

function renderPendingVerifications(verifications) {
  const container = document.getElementById('pending-verifications');
  
  if (!container) return;

  if (verifications.length === 0) {
    container.innerHTML = '<p>No pending verifications.</p>';
    return;
  }

  container.innerHTML = verifications.slice(0, 5).map(verification => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${verification.first_name} ${verification.last_name}</h4>
        <p>${verification.department_code || 'Department'} • Class of ${verification.graduation_year || 'Year'}</p>
        <p>Company: ${verification.company_name || 'Not specified'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-success" onclick="verifyAlumni(${verification.alumni_id})">Verify</button>
        <button class="btn btn-secondary" onclick="viewAlumniDetails(${verification.alumni_id})">View Details</button>
      </div>
    </div>
  `).join('');
}

async function loadPendingEvents() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/pending-events`);
    
    if (response && response.ok) {
      const events = await response.json();
      renderPendingEvents(events);
    }
  } catch (error) {
    console.error('Error loading pending events:', error);
  }
}

function renderPendingEvents(events) {
  const container = document.getElementById('pending-events');
  
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = '<p>No pending events.</p>';
    return;
  }

  container.innerHTML = events.slice(0, 5).map(event => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${event.title}</h4>
        <p>${formatDate(event.event_date)} • ${event.venue || 'TBD'}</p>
        <p>Created by: ${event.creator_name || 'User'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-success" onclick="approveEvent(${event.event_id})">Approve</button>
        <button class="btn btn-secondary" onclick="viewEventDetails(${event.event_id})">View Details</button>
      </div>
    </div>
  `).join('');
}

async function loadRecentActivity() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/recent-activity`);
    
    if (response && response.ok) {
      const activities = await response.json();
      renderRecentActivity(activities);
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
  }
}

function renderRecentActivity(activities) {
  const container = document.getElementById('recent-activity');
  
  if (!container) return;

  if (activities.length === 0) {
    container.innerHTML = '<p>No recent activity.</p>';
    return;
  }

  container.innerHTML = activities.slice(0, 10).map(activity => `
    <div class="notification-item">
      <p>${activity.description}</p>
      <span class="notification-time">${formatDate(activity.created_at)}</span>
    </div>
  `).join('');
}

// Action functions
async function verifyAlumni(alumniId) {
  if (!confirm('Are you sure you want to verify this alumni?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/verify-alumni/${alumniId}`, {
      method: 'PUT'
    });

    if (response && response.ok) {
      alert('Alumni verified successfully!');
      await loadAdminDashboardData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to verify alumni');
    }
  } catch (error) {
    console.error('Error verifying alumni:', error);
    alert('Network error. Please try again.');
  }
}

async function approveEvent(eventId) {
  if (!confirm('Are you sure you want to approve this event?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/approve-event/${eventId}`, {
      method: 'PUT'
    });

    if (response && response.ok) {
      alert('Event approved successfully!');
      await loadAdminDashboardData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to approve event');
    }
  } catch (error) {
    console.error('Error approving event:', error);
    alert('Network error. Please try again.');
  }
}

function viewAlumniDetails(alumniId) {
  window.location.href = `profile.html?id=${alumniId}`;
}

function viewEventDetails(eventId) {
  window.location.href = `events.html?id=${eventId}`;
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