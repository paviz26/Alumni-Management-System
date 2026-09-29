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
    alert('Alumni verification is only accessible to administrators');
    window.location.href = '../index.html';
    return;
  }
  
  // Update user information in the UI
  updateUserInterface(currentUser);

  // Load verification data
  loadVerificationData('PENDING');
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

async function loadVerificationData(status = 'PENDING') {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/alumni-verification?status=${status}`);
    
    if (response && response.ok) {
      const alumni = await response.json();
      renderVerificationList(alumni);
    }
  } catch (error) {
    console.error('Error loading verification data:', error);
    document.getElementById('verification-list').innerHTML = '<p style="text-align: center; color: #dc2626;">Error loading verification data. Please try again.</p>';
  }
}

function renderVerificationList(alumni) {
  const container = document.getElementById('verification-list');
  
  if (!container) return;

  if (alumni.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6b7280;">No alumni found matching the criteria.</p>';
    return;
  }

  container.innerHTML = alumni.map(alum => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${alum.first_name} ${alum.last_name} ${alum.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}</h4>
        <p>${alum.department_code || 'Department'} • Class of ${alum.graduation_year || 'Year'}</p>
        <p>Company: ${alum.company_name || 'Not specified'}</p>
        <p>Job Title: ${alum.designation || 'Not specified'}</p>
        <p>Location: ${alum.location || 'Not specified'}</p>
        <p>Status: <span class="badge ${alum.verification_status ? alum.verification_status.toLowerCase() : 'pending'}">${alum.verification_status || 'PENDING'}</span></p>
        ${alum.bio ? `<p style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">${alum.bio.substring(0, 100)}...</p>` : ''}
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewAlumniProfile(${alum.alumni_id})">View Profile</button>
        ${!alum.verified && alum.verification_status !== 'REJECTED' ? `
          <button class="btn btn-success" onclick="verifyAlumni(${alum.alumni_id})">Verify</button>
          <button class="btn btn-secondary" onclick="rejectAlumni(${alum.alumni_id})">Reject</button>
        ` : ''}
        ${alum.verification_status === 'REJECTED' ? `
          <button class="btn btn-success" onclick="verifyAlumni(${alum.alumni_id})">Re-verify</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function filterAlumni() {
  const status = document.getElementById('filter-status').value;
  loadVerificationData(status);
}

// Action functions
async function verifyAlumni(alumniId) {
  if (!confirm('Are you sure you want to verify this alumni? This will give them a verified badge on their profile.')) {
    return;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/verify-alumni/${alumniId}`, {
      method: 'PUT'
    });

    if (response && response.ok) {
      alert('Alumni verified successfully!');
      // Reload current filter
      const currentStatus = document.getElementById('filter-status').value;
      loadVerificationData(currentStatus);
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to verify alumni');
    }
  } catch (error) {
    console.error('Error verifying alumni:', error);
    alert('Network error. Please try again.');
  }
}

async function rejectAlumni(alumniId) {
  const reason = prompt('Please provide a reason for rejection:');
  if (!reason) return;

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/reject-alumni/${alumniId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (response && response.ok) {
      alert('Alumni verification rejected.');
      // Reload current filter
      const currentStatus = document.getElementById('filter-status').value;
      loadVerificationData(currentStatus);
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to reject alumni verification');
    }
  } catch (error) {
    console.error('Error rejecting alumni:', error);
    alert('Network error. Please try again.');
  }
}

function viewAlumniProfile(alumniId) {
  window.location.href = `profile.html?id=${alumniId}`;
}