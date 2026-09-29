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

  // Load connections data
  loadConnectionsData();
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

async function loadConnectionsData() {
  try {
    // Load all connections data in parallel
    await Promise.all([
      loadConnectionRequests(),
      loadMyConnections(),
      loadSentRequests()
    ]);
  } catch (error) {
    console.error('Error loading connections data:', error);
  }
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
        <p>${request.requester_department || 'Department'} • ${request.requester_year || 'Year'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-success" onclick="respondToConnection(${request.connection_id}, 'ACCEPTED')">Accept</button>
        <button class="btn btn-secondary" onclick="respondToConnection(${request.connection_id}, 'REJECTED')">Reject</button>
      </div>
    </div>
  `).join('');
}

async function loadMyConnections() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/connections/my-connections`);
    
    if (response && response.ok) {
      const connections = await response.json();
      renderMyConnections(connections);
    }
  } catch (error) {
    console.error('Error loading my connections:', error);
  }
}

function renderMyConnections(connections) {
  const container = document.getElementById('my-connections');
  
  if (!container) return;

  if (connections.length === 0) {
    container.innerHTML = '<p>No connections yet. Start connecting with alumni!</p>';
    return;
  }

  container.innerHTML = connections.map(connection => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${connection.name} ✓ Connected</h4>
        <p>${connection.title || 'Alumni'}</p>
        <p>${connection.department || 'Department'} • ${connection.graduation_year || 'Year'}</p>
        <p>Connected since: ${formatDate(connection.connected_at)}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewProfile(${connection.alumni_id})">View Profile</button>
        <button class="btn btn-secondary" onclick="messageConnection(${connection.alumni_id})">Message</button>
      </div>
    </div>
  `).join('');
}

async function loadSentRequests() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/connections/sent-requests`);
    
    if (response && response.ok) {
      const requests = await response.json();
      renderSentRequests(requests);
    }
  } catch (error) {
    console.error('Error loading sent requests:', error);
  }
}

function renderSentRequests(requests) {
  const container = document.getElementById('sent-requests');
  
  if (!container) return;

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  
  if (pendingRequests.length === 0) {
    container.innerHTML = '<p>No pending sent requests.</p>';
    return;
  }

  container.innerHTML = pendingRequests.map(request => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${request.recipient_name}</h4>
        <p>${request.recipient_title || 'Alumni'}</p>
        <p>Status: <span class="badge pending">Pending</span></p>
        <p>Sent: ${formatDate(request.created_at)}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary" onclick="cancelRequest(${request.connection_id})">Cancel Request</button>
      </div>
    </div>
  `).join('');
}

// Action functions
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
      await loadConnectionsData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to respond to connection request');
    }
  } catch (error) {
    console.error('Error responding to connection:', error);
    alert('Network error. Please try again.');
  }
}

async function cancelRequest(connectionId) {
  if (!confirm('Are you sure you want to cancel this connection request?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/connections/${connectionId}`, {
      method: 'DELETE'
    });

    if (response && response.ok) {
      alert('Connection request cancelled successfully!');
      await loadConnectionsData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to cancel request');
    }
  } catch (error) {
    console.error('Error cancelling request:', error);
    alert('Network error. Please try again.');
  }
}

function viewProfile(alumniId) {
  window.location.href = `profile.html?id=${alumniId}`;
}

function messageConnection(alumniId) {
  // This would open a messaging interface
  alert('Messaging feature coming soon!');
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