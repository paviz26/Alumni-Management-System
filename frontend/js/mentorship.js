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

  // Check if there's a pre-selected mentor from URL
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedMentorId = urlParams.get('alumni_id');

  // Load mentorship data
  loadMentorshipData(preSelectedMentorId);

  // Show/hide mentor-specific sections based on role
  if (currentUser.role === 'ALUMNI') {
    document.getElementById('mentor-requests-card').style.display = 'block';
  }
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

async function loadMentorshipData(preSelectedMentorId = null) {
  try {
    // Load all mentorship data in parallel
    await Promise.all([
      loadAvailableMentors(preSelectedMentorId),
      loadMyMentorshipRequests(),
      loadActiveMentorships(),
      loadMentorRequests()
    ]);
  } catch (error) {
    console.error('Error loading mentorship data:', error);
  }
}

async function loadAvailableMentors(preSelectedMentorId = null) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/available-mentors`);
    
    if (response && response.ok) {
      const mentors = await response.json();
      populateMentorSelect(mentors, preSelectedMentorId);
    }
  } catch (error) {
    console.error('Error loading available mentors:', error);
  }
}

function populateMentorSelect(mentors, preSelectedMentorId) {
  const mentorSelect = document.getElementById('mentor-select');
  
  if (!mentorSelect) return;

  // Clear existing options except the first one
  mentorSelect.innerHTML = '<option value="">Select an alumni to mentor you</option>';

  mentors.forEach(mentor => {
    const option = document.createElement('option');
    option.value = mentor.alumni_id;
    option.textContent = `${mentor.first_name} ${mentor.last_name} - ${mentor.designation || 'Alumni'} @ ${mentor.company_name || 'Company'}`;
    mentorSelect.appendChild(option);
  });

  // Pre-select mentor if provided
  if (preSelectedMentorId) {
    mentorSelect.value = preSelectedMentorId;
  }
}

async function loadMyMentorshipRequests() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/my-requests`);
    
    if (response && response.ok) {
      const requests = await response.json();
      renderMyMentorshipRequests(requests);
    }
  } catch (error) {
    console.error('Error loading my mentorship requests:', error);
  }
}

function renderMyMentorshipRequests(requests) {
  const container = document.getElementById('my-mentorship-requests');
  
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = '<p>No mentorship requests sent yet.</p>';
    return;
  }

  container.innerHTML = requests.map(request => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${request.mentor_name}</h4>
        <p>Area: ${request.area_of_interest || 'General'}</p>
        <p>Message: ${request.message || 'No message'}</p>
        <p>Status: <span class="badge ${request.status.toLowerCase()}">${request.status}</span></p>
        <p>Requested: ${formatDate(request.requested_at)}</p>
      </div>
      <div class="list-item-actions">
        ${request.status === 'PENDING' ? `<button class="btn btn-secondary" onclick="cancelMentorshipRequest(${request.mentorship_id})">Cancel</button>` : ''}
        ${request.status === 'ACCEPTED' ? `<button class="btn btn-primary" onclick="viewMentorProfile(${request.mentor_id})">View Mentor Profile</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function loadActiveMentorships() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/active`);
    
    if (response && response.ok) {
      const mentorships = await response.json();
      renderActiveMentorships(mentorships);
    }
  } catch (error) {
    console.error('Error loading active mentorships:', error);
  }
}

function renderActiveMentorships(mentorships) {
  const container = document.getElementById('active-mentorships');
  
  if (!container) return;

  if (mentorships.length === 0) {
    container.innerHTML = '<p>No active mentorships.</p>';
    return;
  }

  container.innerHTML = mentorships.map(mentorship => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${mentorship.mentor_name}</h4>
        <p>Area: ${mentorship.area_of_interest || 'General'}</p>
        <p>Started: ${formatDate(mentorship.started_at || mentorship.requested_at)}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewMentorProfile(${mentorship.mentor_id})">View Profile</button>
        <button class="btn btn-success" onclick="completeMentorship(${mentorship.mentorship_id})">Complete</button>
      </div>
    </div>
  `).join('');
}

async function loadMentorRequests() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/requests`);
    
    if (response && response.ok) {
      const requests = await response.json();
      renderMentorRequests(requests);
    }
  } catch (error) {
    console.error('Error loading mentor requests:', error);
  }
}

function renderMentorRequests(requests) {
  const container = document.getElementById('mentor-requests');
  
  if (!container) return;

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  
  if (pendingRequests.length === 0) {
    container.innerHTML = '<p>No mentorship requests received.</p>';
    return;
  }

  container.innerHTML = pendingRequests.map(request => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${request.mentee_name}</h4>
        <p>Area: ${request.area_of_interest || 'General'}</p>
        <p>Message: ${request.message || 'No message'}</p>
        <p>Requested: ${formatDate(request.requested_at)}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-success" onclick="respondToMentorship(${request.mentorship_id}, 'ACCEPTED')">Accept</button>
        <button class="btn btn-secondary" onclick="respondToMentorship(${request.mentorship_id}, 'REJECTED')">Reject</button>
      </div>
    </div>
  `).join('');
}

// Action functions
async function sendMentorshipRequest() {
  const mentorId = document.getElementById('mentor-select').value;
  const areaOfInterest = document.getElementById('area-of-interest').value;
  const message = document.getElementById('mentorship-message').value;

  if (!mentorId) {
    alert('Please select a mentor');
    return;
  }

  if (!areaOfInterest) {
    alert('Please select an area of interest');
    return;
  }

  if (!message.trim()) {
    alert('Please provide a message explaining why you want mentorship');
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mentor_id: parseInt(mentorId),
        area_of_interest: areaOfInterest,
        message: message
      })
    });

    if (response && response.ok) {
      alert('Mentorship request sent successfully!');
      // Clear form
      document.getElementById('mentor-select').value = '';
      document.getElementById('area-of-interest').value = '';
      document.getElementById('mentorship-message').value = '';
      // Reload data
      await loadMentorshipData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to send mentorship request');
    }
  } catch (error) {
    console.error('Error sending mentorship request:', error);
    alert('Network error. Please try again.');
  }
}

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
      await loadMentorshipData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to respond to mentorship request');
    }
  } catch (error) {
    console.error('Error responding to mentorship:', error);
    alert('Network error. Please try again.');
  }
}

async function cancelMentorshipRequest(mentorshipId) {
  if (!confirm('Are you sure you want to cancel this mentorship request?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/${mentorshipId}`, {
      method: 'DELETE'
    });

    if (response && response.ok) {
      alert('Mentorship request cancelled successfully!');
      await loadMentorshipData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to cancel request');
    }
  } catch (error) {
    console.error('Error cancelling mentorship request:', error);
    alert('Network error. Please try again.');
  }
}

async function completeMentorship(mentorshipId) {
  if (!confirm('Are you sure you want to mark this mentorship as completed?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/mentorship/${mentorshipId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });

    if (response && response.ok) {
      alert('Mentorship marked as completed!');
      await loadMentorshipData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to complete mentorship');
    }
  } catch (error) {
    console.error('Error completing mentorship:', error);
    alert('Network error. Please try again.');
  }
}

function viewMentorProfile(mentorId) {
  window.location.href = `profile.html?id=${mentorId}`;
}

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}