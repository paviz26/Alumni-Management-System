const API_BASE_URL = "http://localhost:5000/api";

let currentProfileData = null;
let isViewingOwnProfile = true;

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = getCurrentUser();
  
  // Update user information in the UI
  updateUserInterface(currentUser);

  // Check if viewing another user's profile
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');

  if (profileId && profileId != currentUser.userId) {
    isViewingOwnProfile = false;
    loadOtherUserProfile(profileId);
  } else {
    loadOwnProfile();
  }

  // Setup edit form handler
  setupEditForm();
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

async function loadOwnProfile() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/me`);
    
    if (response && response.ok) {
      const profileData = await response.json();
      currentProfileData = profileData;
      renderProfile(profileData, true);
    } else {
      console.error('Error loading profile:', response.status);
      document.getElementById('profile-content').innerHTML = '<p style="text-align: center; color: #dc2626;">Error loading profile. Please try again.</p>';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    document.getElementById('profile-content').innerHTML = '<p style="text-align: center; color: #dc2626;">Network error. Please try again.</p>';
  }
}

async function loadOtherUserProfile(alumniId) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/${alumniId}`);
    
    if (response && response.ok) {
      const profileData = await response.json();
      currentProfileData = profileData;
      renderProfile(profileData, false);
    } else {
      console.error('Error loading profile:', response.status);
      document.getElementById('profile-content').innerHTML = '<p style="text-align: center; color: #dc2626;">Error loading profile. Please try again.</p>';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    document.getElementById('profile-content').innerHTML = '<p style="text-align: center; color: #dc2626;">Network error. Please try again.</p>';
  }
}

function renderProfile(profileData, isOwnProfile) {
  const viewMode = document.getElementById('view-mode');
  const editMode = document.getElementById('edit-mode');
  const profileActions = document.getElementById('profile-actions');

  // Show view mode
  viewMode.style.display = 'block';
  editMode.style.display = 'none';

  // Update profile information
  const profileAvatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-name');
  const profileTitle = document.getElementById('profile-title');
  const profileDeptYear = document.getElementById('profile-dept-year');
  const profileLocation = document.getElementById('profile-location');
  const profileBio = document.getElementById('profile-bio');
  const profileCompany = document.getElementById('profile-company');
  const profileJobTitle = document.getElementById('profile-job-title');
  const profileDepartment = document.getElementById('profile-department');
  const profileGradYear = document.getElementById('profile-grad-year');
  const profileEmail = document.getElementById('profile-email');
  const profilePhone = document.getElementById('profile-phone');
  const profileLinkedin = document.getElementById('profile-linkedin');
  const profileGithub = document.getElementById('profile-github');
  const verifiedBadge = document.getElementById('verified-badge');
  const profileAchievements = document.getElementById('profile-achievements');

  // Set avatar
  if (profileAvatar) {
    const initial = (profileData.first_name && profileData.first_name[0]) || 'A';
    profileAvatar.textContent = initial.toUpperCase();
  }

  // Set name and verification badge
  if (profileName) {
    profileName.innerHTML = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() + 
      (profileData.verified ? '<span class="verified-badge">✓ Verified Alumni</span>' : '');
  }

  // Set professional info
  if (profileTitle) {
    profileTitle.textContent = `${profileData.designation || 'Alumni'} @ ${profileData.company_name || 'Company'}`;
  }

  if (profileDeptYear) {
    profileDeptYear.textContent = `${profileData.department_code || 'Department'} • Class of ${profileData.graduation_year || 'Year'}`;
  }

  if (profileLocation) {
    profileLocation.textContent = profileData.location || 'Location not specified';
  }

  // Set bio
  if (profileBio) {
    profileBio.textContent = profileData.bio || 'No bio information provided.';
  }

  // Set professional details
  if (profileCompany) {
    profileCompany.textContent = profileData.company_name || 'Not specified';
  }

  if (profileJobTitle) {
    profileJobTitle.textContent = profileData.designation || 'Not specified';
  }

  if (profileDepartment) {
    profileDepartment.textContent = profileData.department_code || 'Not specified';
  }

  if (profileGradYear) {
    profileGradYear.textContent = profileData.graduation_year || 'Not specified';
  }

  // Set contact info
  if (profileEmail) {
    profileEmail.textContent = profileData.email || 'Not specified';
  }

  if (profilePhone) {
    profilePhone.textContent = profileData.phone || 'Not specified';
  }

  if (profileLinkedin) {
    if (profileData.linkedin_url) {
      profileLinkedin.href = profileData.linkedin_url;
      profileLinkedin.textContent = 'LinkedIn Profile';
      profileLinkedin.style.display = 'inline';
    } else {
      profileLinkedin.style.display = 'none';
    }
  }

  if (profileGithub) {
    if (profileData.github_url) {
      profileGithub.href = profileData.github_url;
      profileGithub.textContent = 'GitHub Profile';
      profileGithub.style.display = 'inline';
    } else {
      profileGithub.style.display = 'none';
    }
  }

  // Set verification badge
  if (verifiedBadge) {
    verifiedBadge.style.display = profileData.verified ? 'inline-block' : 'none';
  }

  // Render achievements
  if (profileAchievements && profileData.achievements) {
    if (profileData.achievements.length === 0) {
      profileAchievements.innerHTML = '<p>No achievements added yet.</p>';
    } else {
      profileAchievements.innerHTML = profileData.achievements.map(achievement => `
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
  }

  // Show/hide edit actions based on ownership
  if (profileActions) {
    if (isOwnProfile) {
      profileActions.style.display = 'flex';
      profileActions.innerHTML = `
        <button class="btn btn-primary" onclick="enableEditMode()">Edit Profile</button>
        <button class="btn btn-success" onclick="window.location.href='achievements.html'">Add Achievement</button>
      `;
    } else {
      profileActions.style.display = 'flex';
      profileActions.innerHTML = `
        <button class="btn btn-primary" onclick="connectWithAlumni(${profileData.alumni_id})">Connect</button>
        <button class="btn btn-success" onclick="requestMentorship(${profileData.alumni_id})">Request Mentorship</button>
      `;
    }
  }
}

function enableEditMode() {
  const viewMode = document.getElementById('view-mode');
  const editMode = document.getElementById('edit-mode');

  viewMode.style.display = 'none';
  editMode.style.display = 'block';

  // Populate form with current data
  if (currentProfileData) {
    document.getElementById('edit-first-name').value = currentProfileData.first_name || '';
    document.getElementById('edit-last-name').value = currentProfileData.last_name || '';
    document.getElementById('edit-phone').value = currentProfileData.phone || '';
    document.getElementById('edit-company').value = currentProfileData.company_name || '';
    document.getElementById('edit-job-title').value = currentProfileData.designation || '';
    document.getElementById('edit-location').value = currentProfileData.location || '';
    document.getElementById('edit-bio').value = currentProfileData.bio || '';
    document.getElementById('edit-linkedin').value = currentProfileData.linkedin_url || '';
    document.getElementById('edit-github').value = currentProfileData.github_url || '';
  }
}

function cancelEdit() {
  const viewMode = document.getElementById('view-mode');
  const editMode = document.getElementById('edit-mode');

  viewMode.style.display = 'block';
  editMode.style.display = 'none';
}

function setupEditForm() {
  const editForm = document.getElementById('edit-profile-form');
  
  if (editForm) {
    editForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        firstName: document.getElementById('edit-first-name').value,
        lastName: document.getElementById('edit-last-name').value,
        phone: document.getElementById('edit-phone').value,
        company: document.getElementById('edit-company').value,
        jobTitle: document.getElementById('edit-job-title').value,
        location: document.getElementById('edit-location').value,
        bio: document.getElementById('edit-bio').value,
        linkedinUrl: document.getElementById('edit-linkedin').value,
        githubUrl: document.getElementById('edit-github').value
      };

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/alumni/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response && response.ok) {
          alert('Profile updated successfully!');
          // Reload profile
          await loadOwnProfile();
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Network error. Please try again.');
      }
    });
  }
}

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
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to send connection request');
    }
  } catch (error) {
    console.error('Error sending connection request:', error);
    alert('Network error. Please try again.');
  }
}

async function requestMentorship(alumniId) {
  window.location.href = `mentorship.html?action=request&alumni_id=${alumniId}`;
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