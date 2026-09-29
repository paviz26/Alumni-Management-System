const API_BASE_URL = "http://localhost:5000/api";

let currentPage = 1;
let totalPages = 1;
let currentSearchResults = [];

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = getCurrentUser();
  
  // Update user information in the UI
  updateUserInterface(currentUser);

  // Load initial alumni data
  loadAlumni();
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

async function loadAlumni(page = 1) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni?page=${page}&limit=10`);
    
    if (response && response.ok) {
      const data = await response.json();
      currentSearchResults = data.alumni || [];
      currentPage = data.currentPage || 1;
      totalPages = data.totalPages || 1;
      
      renderAlumniResults(currentSearchResults);
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading alumni:', error);
    document.getElementById('alumni-results').innerHTML = '<p style="text-align: center; color: #dc2626;">Error loading alumni. Please try again.</p>';
  }
}

async function searchAlumni(page = 1) {
  const keyword = document.getElementById('search-keyword').value;
  const department = document.getElementById('filter-department').value;
  const year = document.getElementById('filter-year').value;
  const field = document.getElementById('filter-field').value;
  const company = document.getElementById('filter-company').value;
  const location = document.getElementById('filter-location').value;

  // Build query parameters
  const params = new URLSearchParams();
  if (keyword) params.append('keyword', keyword);
  if (department) params.append('department', department);
  if (year) params.append('graduationYear', year);
  if (field) params.append('field', field);
  if (company) params.append('company', company);
  if (location) params.append('location', location);
  params.append('page', page);
  params.append('limit', 10);

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alumni/search?${params.toString()}`);
    
    if (response && response.ok) {
      const data = await response.json();
      currentSearchResults = data.alumni || [];
      currentPage = data.currentPage || 1;
      totalPages = data.totalPages || 1;
      
      renderAlumniResults(currentSearchResults);
      updatePagination();
    } else {
      const data = await response.json();
      document.getElementById('alumni-results').innerHTML = `<p style="text-align: center; color: #dc2626;">${data.message || 'Search failed. Please try again.'}</p>`;
    }
  } catch (error) {
    console.error('Error searching alumni:', error);
    document.getElementById('alumni-results').innerHTML = '<p style="text-align: center; color: #dc2626;">Network error. Please try again.</p>';
  }
}

function renderAlumniResults(alumni) {
  const container = document.getElementById('alumni-results');
  const resultsCount = document.getElementById('results-count');
  
  if (!container) return;

  if (alumni.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6b7280;">No alumni found matching your criteria.</p>';
    resultsCount.textContent = '0 alumni found';
    return;
  }

  resultsCount.textContent = `${alumni.length} alumni found`;

  container.innerHTML = alumni.map(alum => `
    <div class="list-item">
      <div class="list-item-info">
        <h4>${alum.first_name} ${alum.last_name} ${alum.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}</h4>
        <p>${alum.designation || 'Alumni'} @ ${alum.company_name || 'Company'}</p>
        <p>${alum.department_code || 'Department'} • Class of ${alum.graduation_year || 'Year'}</p>
        <p>${alum.location || 'Location not specified'}</p>
        ${alum.bio ? `<p style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">${alum.bio.substring(0, 100)}...</p>` : ''}
      </div>
      <div class="list-item-actions">
        <button class="btn btn-primary" onclick="viewAlumniProfile(${alum.alumni_id})">View Profile</button>
        <button class="btn btn-success" onclick="connectWithAlumni(${alum.alumni_id})">Connect</button>
        <button class="btn btn-secondary" onclick="requestMentorship(${alum.alumni_id})">Mentorship</button>
      </div>
    </div>
  `).join('');
}

function updatePagination() {
  const pagination = document.getElementById('pagination');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const pageInfo = document.getElementById('page-info');

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'block';
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    searchAlumni(currentPage);
  }
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    searchAlumni(currentPage);
  }
}

function clearFilters() {
  document.getElementById('search-keyword').value = '';
  document.getElementById('filter-department').value = '';
  document.getElementById('filter-year').value = '';
  document.getElementById('filter-field').value = '';
  document.getElementById('filter-company').value = '';
  document.getElementById('filter-location').value = '';
  
  currentPage = 1;
  loadAlumni();
}

async function viewAlumniProfile(alumniId) {
  window.location.href = `profile.html?id=${alumniId}`;
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