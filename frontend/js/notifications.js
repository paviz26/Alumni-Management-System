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

  // Load notifications
  loadNotifications();
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

async function loadNotifications() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications`);
    
    if (response && response.ok) {
      const notifications = await response.json();
      renderNotifications(notifications);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    document.getElementById('notifications-list').innerHTML = '<p style="text-align: center; color: #dc2626;">Error loading notifications. Please try again.</p>';
  }
}

function renderNotifications(notifications) {
  const container = document.getElementById('notifications-list');
  
  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6b7280;">No notifications yet.</p>';
    return;
  }

  container.innerHTML = notifications.map(notification => `
    <div class="notification-item ${notification.read ? '' : 'unread'}">
      <p>${notification.message}</p>
      <span class="notification-time">${formatDate(notification.created_at)}</span>
      ${!notification.read ? `<button class="btn btn-secondary" style="margin-top: 10px; padding: 5px 10px; font-size: 0.8rem;" onclick="markAsRead(${notification.notification_id})">Mark as Read</button>` : ''}
    </div>
  `).join('');
}

async function markAsRead(notificationId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT'
    });

    if (response && response.ok) {
      // Reload notifications
      await loadNotifications();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function markAllAsRead() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT'
    });

    if (response && response.ok) {
      alert('All notifications marked as read!');
      await loadNotifications();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to mark all notifications as read');
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    alert('Network error. Please try again.');
  }
}

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}