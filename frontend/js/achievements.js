const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = getCurrentUser();
  
  // Check if user is alumni
  if (currentUser.role !== 'ALUMNI') {
    alert('Achievements page is only available for alumni');
    window.location.href = 'alumni-dashboard.html';
    return;
  }
  
  // Update user information in the UI
  updateUserInterface(currentUser);

  // Load achievements data
  loadAchievements();

  // Setup add achievement form
  setupAddAchievementForm();
});

function updateUserInterface(user) {
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');

  if (userName) {
    userName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Alumni';
  }

  if (userAvatar) {
    const initial = (user.firstName && user.firstName[0]) || 'A';
    userAvatar.textContent = initial.toUpperCase();
  }
}

async function loadAchievements() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/achievements`);
    
    if (response && response.ok) {
      const achievements = await response.json();
      renderAchievements(achievements);
    }
  } catch (error) {
    console.error('Error loading achievements:', error);
  }
}

function renderAchievements(achievements) {
  const container = document.getElementById('my-achievements');
  
  if (!container) return;

  if (achievements.length === 0) {
    container.innerHTML = '<p>No achievements added yet. Start showcasing your accomplishments!</p>';
    return;
  }

  container.innerHTML = achievements.map(achievement => `
    <div class="achievement-item">
      <div class="achievement-header">
        <span class="achievement-icon">🏆</span>
        <span class="achievement-title">${achievement.title}</span>
      </div>
      <p class="achievement-description">${achievement.description || 'No description provided'}</p>
      <p class="achievement-date">${formatDate(achievement.achievement_date)}</p>
      <div class="profile-actions" style="margin-top: 10px;">
        <button class="btn btn-primary" onclick="editAchievement(${achievement.achievement_id})">Edit</button>
        <button class="btn btn-secondary" onclick="deleteAchievement(${achievement.achievement_id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function setupAddAchievementForm() {
  const addAchievementForm = document.getElementById('add-achievement-form');
  
  if (addAchievementForm) {
    addAchievementForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const achievementData = {
        title: document.getElementById('achievement-title').value,
        description: document.getElementById('achievement-description').value,
        achievementDate: document.getElementById('achievement-date').value
      };

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/alumni/achievements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(achievementData)
        });

        if (response && response.ok) {
          alert('Achievement added successfully!');
          // Clear form
          addAchievementForm.reset();
          // Reload achievements
          await loadAchievements();
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to add achievement');
        }
      } catch (error) {
        console.error('Error adding achievement:', error);
        alert('Network error. Please try again.');
      }
    });
  }
}

// Action functions
async function editAchievement(achievementId) {
  const newTitle = prompt('Enter new title:');
  if (!newTitle) return;

  const newDescription = prompt('Enter new description:');
  const newDate = prompt('Enter new date (YYYY-MM-DD):');

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/achievements/${achievementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription,
        achievementDate: newDate
      })
    });

    if (response && response.ok) {
      alert('Achievement updated successfully!');
      await loadAchievements();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to update achievement');
    }
  } catch (error) {
    console.error('Error updating achievement:', error);
    alert('Network error. Please try again.');
  }
}

async function deleteAchievement(achievementId) {
  if (!confirm('Are you sure you want to delete this achievement?')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/achievements/${achievementId}`, {
      method: 'DELETE'
    });

    if (response && response.ok) {
      alert('Achievement deleted successfully!');
      await loadAchievements();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to delete achievement');
    }
  } catch (error) {
    console.error('Error deleting achievement:', error);
    alert('Network error. Please try again.');
  }
}

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}