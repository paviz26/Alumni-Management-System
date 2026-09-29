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
  const profileDesignation = document.getElementById('profile-designation');
  const profileDepartment = document.getElementById('profile-department');

  if (userName) {
    userName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Faculty';
  }

  if (userAvatar && profileAvatar) {
    const initial = (user.firstName && user.firstName[0]) || 'F';
    userAvatar.textContent = initial.toUpperCase();
    profileAvatar.textContent = initial.toUpperCase();
  }

  if (profileName) {
    profileName.textContent = `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  if (profileDesignation) {
    profileDesignation.textContent = user.designation || 'Professor';
  }

  if (profileDepartment) {
    profileDepartment.textContent = user.department || 'Department';
  }
}

async function loadDashboardData() {
  try {
    // Load all dashboard data in parallel
    await Promise.all([
      loadDepartmentStats(),
      loadRecentEvents(),
      loadRecentAnnouncements(),
      loadDepartmentStudents(),
      loadDepartmentAlumni(),
      loadMentorshipOverview()
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadDepartmentStats() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/faculty/department-stats`);
    
    if (response && response.ok) {
      const stats = await response.json();
      updateDepartmentStats(stats);
    }
  } catch (error) {
    console.error('Error loading department stats:', error);
  }
}

function updateDepartmentStats(stats) {
  const studentsCount = document.getElementById('students-count');
  const alumniCount = document.getElementById('alumni-count');

  if (studentsCount) {
    studentsCount.textContent = stats.students || 0;
  }

  if (alumniCount) {
    alumniCount.textContent = stats.alumni || 0;
  }
}

async function loadRecentEvents() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/recent`);
    
    if (response && response.ok) {
      const events = await response.json();
      renderRecentEvents(events);
    }
  } catch (error) {
    console.error('Error loading recent events:', error);
  }
}

function renderRecentEvents(events) {
  const container = document.getElementById('recent-events');
  
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = '<p>No recent events.</p>';
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

async function loadRecentAnnouncements() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/announcements/recent`);
    
    if (response && response.ok) {
      const announcements = await response.json();
      renderRecentAnnouncements(announcements);
    }
  } catch (error) {
    console.error('Error loading recent announcements:', error);
  }
}

function renderRecentAnnouncements(announcements) {
  const container = document.getElementById('recent-announcements');
  
  if (!container) return;

  if (announcements.length === 0) {
    container.innerHTML = '<p>No recent announcements.</p>';
    return;
  }

  container.innerHTML = announcements.slice(0, 3).map(announcement => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${announcement.title}</h4>
        <p>${announcement.content.substring(0, 100)}...</p>
        <p class="notification-time">${formatDate(announcement.published_at)}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewAnnouncement(${announcement.announcement_id})">View</button>
      </div>
    </div>
  `).join('');
}

async function loadDepartmentStudents() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/faculty/students`);
    
    if (response && response.ok) {
      const students = await response.json();
      renderDepartmentStudents(students);
    }
  } catch (error) {
    console.error('Error loading department students:', error);
  }
}

function renderDepartmentStudents(students) {
  const container = document.getElementById('department-students');
  
  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = '<p>No students in department.</p>';
    return;
  }

  container.innerHTML = students.slice(0, 5).map(student => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${student.first_name} ${student.last_name}</h4>
        <p>${student.registration_number || 'No reg number'}</p>
        <p>${student.department_code || 'Department'}</p>
      </div>
    </div>
  `).join('');
}

async function loadDepartmentAlumni() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/faculty/alumni`);
    
    if (response && response.ok) {
      const alumni = await response.json();
      renderDepartmentAlumni(alumni);
    }
  } catch (error) {
    console.error('Error loading department alumni:', error);
  }
}

function renderDepartmentAlumni(alumni) {
  const container = document.getElementById('department-alumni');
  
  if (!container) return;

  if (alumni.length === 0) {
    container.innerHTML = '<p>No alumni in department.</p>';
    return;
  }

  container.innerHTML = alumni.slice(0, 5).map(alum => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${alum.first_name} ${alum.last_name}</h4>
        <p>${alum.designation || 'Alumni'} @ ${alum.company_name || 'Company'}</p>
        <p>Class of ${alum.graduation_year || 'Year'}</p>
      </div>
    </div>
  `).join('');
}

async function loadMentorshipOverview() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/overview`);
    
    if (response && response.ok) {
      const mentorshipData = await response.json();
      renderMentorshipOverview(mentorshipData);
    }
  } catch (error) {
    console.error('Error loading mentorship overview:', error);
  }
}

function renderMentorshipOverview(data) {
  const container = document.getElementById('mentorship-overview');
  
  if (!container) return;

  container.innerHTML = `
    <div class="stat-card" style="padding: 15px;">
      <div class="stat-number">${data.active || 0}</div>
      <div class="stat-label">Active Mentorships</div>
    </div>
    <div class="stat-card" style="padding: 15px;">
      <div class="stat-number">${data.completed || 0}</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card" style="padding: 15px;">
      <div class="stat-number">${data.pending || 0}</div>
      <div class="stat-label">Pending Requests</div>
    </div>
  `;
}

// Action functions
function editProfile() {
  window.location.href = 'profile.html?edit=true';
}

function createEvent() {
  window.location.href = 'events.html?action=create';
}

function createAnnouncement() {
  window.location.href = 'announcements.html?action=create';
}

function viewMentorship() {
  window.location.href = 'mentorship.html';
}

function viewEventDetails(eventId) {
  window.location.href = `events.html?id=${eventId}`;
}

function viewAnnouncement(announcementId) {
  window.location.href = `announcements.html?id=${announcementId}`;
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