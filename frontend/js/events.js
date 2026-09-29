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

  // Show create event card for faculty and admin
  if (currentUser.role === 'FACULTY' || currentUser.role === 'ADMIN') {
    document.getElementById('create-event-card').style.display = 'block';
  }

  // Load events data
  loadEventsData();

  // Setup create event form
  setupCreateEventForm();
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

async function loadEventsData() {
  try {
    // Load all events data in parallel
    await Promise.all([
      loadUpcomingEvents(),
      loadMyRegistrations(),
      loadPastEvents()
    ]);
  } catch (error) {
    console.error('Error loading events data:', error);
  }
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

  container.innerHTML = events.map(event => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${event.title}</h4>
        <p>${formatDate(event.event_date)} • ${event.venue || 'TBD'}</p>
        <p>Type: ${event.type || 'General'}</p>
        <p>Capacity: ${event.capacity || 'Unlimited'} | Registered: ${event.registration_count || 0}</p>
        ${event.description ? `<p style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">${event.description.substring(0, 100)}...</p>` : ''}
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewEventDetails(${event.event_id})">View Details</button>
        ${!event.is_registered ? `<button class="btn btn-success" onclick="registerForEvent(${event.event_id})">Register</button>` : `<button class="btn btn-secondary" disabled>Registered</button>`}
      </div>
    </div>
  `).join('');
}

async function loadMyRegistrations() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/my-registrations`);
    
    if (response && response.ok) {
      const registrations = await response.json();
      renderMyRegistrations(registrations);
    }
  } catch (error) {
    console.error('Error loading my registrations:', error);
  }
}

function renderMyRegistrations(registrations) {
  const container = document.getElementById('my-registrations');
  
  if (!container) return;

  if (registrations.length === 0) {
    container.innerHTML = '<p>No event registrations yet.</p>';
    return;
  }

  container.innerHTML = registrations.map(registration => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${registration.event_title}</h4>
        <p>${formatDate(registration.event_date)} • ${registration.venue || 'TBD'}</p>
        <p>Status: <span class="badge ${registration.attendance_status.toLowerCase()}">${registration.attendance_status}</span></p>
        <p>Registered: ${formatDate(registration.registered_at)}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewEventDetails(${registration.event_id})">View Details</button>
        ${registration.attendance_status === 'REGISTERED' ? `<button class="btn btn-secondary" onclick="cancelRegistration(${registration.registration_id})">Cancel</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function loadPastEvents() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/past`);
    
    if (response && response.ok) {
      const events = await response.json();
      renderPastEvents(events);
    }
  } catch (error) {
    console.error('Error loading past events:', error);
  }
}

function renderPastEvents(events) {
  const container = document.getElementById('past-events');
  
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = '<p>No past events.</p>';
    return;
  }

  container.innerHTML = events.slice(0, 5).map(event => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${event.title}</h4>
        <p>${formatDate(event.event_date)} • ${event.venue || 'TBD'}</p>
        <p>Attendance: ${event.attendance_count || 0} / ${event.capacity || 'Unlimited'}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewEventDetails(${event.event_id})">View Details</button>
      </div>
    </div>
  `).join('');
}

function setupCreateEventForm() {
  const createEventForm = document.getElementById('create-event-form');
  
  if (createEventForm) {
    createEventForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const eventData = {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        eventDate: document.getElementById('event-date').value,
        venue: document.getElementById('event-venue').value,
        capacity: document.getElementById('event-capacity').value ? parseInt(document.getElementById('event-capacity').value) : null,
        type: document.getElementById('event-type').value
      };

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        });

        if (response && response.ok) {
          alert('Event created successfully!');
          // Clear form
          createEventForm.reset();
          // Reload events
          await loadEventsData();
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to create event');
        }
      } catch (error) {
        console.error('Error creating event:', error);
        alert('Network error. Please try again.');
      }
    });
  }
}

// Action functions
async function registerForEvent(eventId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'POST'
    });

    if (response && response.ok) {
      alert('Event registration successful!');
      await loadEventsData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to register for event');
    }
  } catch (error) {
    console.error('Error registering for event:', error);
    alert('Network error. Please try again.');
  }
}

async function cancelRegistration(registrationId) {
  if (!confirm('Are you sure you want to cancel this registration?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/events/registrations/${registrationId}`, {
      method: 'DELETE'
    });

    if (response && response.ok) {
      alert('Registration cancelled successfully!');
      await loadEventsData();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to cancel registration');
    }
  } catch (error) {
    console.error('Error cancelling registration:', error);
    alert('Network error. Please try again.');
  }
}

function viewEventDetails(eventId) {
  // This would open a detailed event view
  alert(`Event details for event ID: ${eventId} - Full event details view coming soon!`);
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