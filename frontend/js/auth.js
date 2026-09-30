window.API_BASE_URL = "http://localhost:5000/api";

// Store authentication token and user data
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // Show loading state
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      hideMessages();

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Store authentication data
          authToken = data.token;
          currentUser = data.user;
          
          localStorage.setItem('authToken', authToken);
          localStorage.setItem('currentUser', JSON.stringify(currentUser));

          // Show success message
          showSuccess('Login successful! Redirecting to dashboard...');

          // Redirect to appropriate dashboard based on role
          setTimeout(() => {
            redirectBasedOnRole(currentUser.role);
          }, 1500);

        } else {
          showError(data.message || 'Login failed. Please check your credentials.');
          loginBtn.disabled = false;
          loginBtn.textContent = 'Login';
        }
      } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please check your connection and try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    });
  }

  // Check if user is already logged in
  if (loginForm && authToken && currentUser) {
    redirectBasedOnRole(currentUser.role);
  }
});

function redirectBasedOnRole(role) {
  switch(role) {
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

function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function showSuccess(message) {
  const successElement = document.getElementById('success-message');
  if (successElement) {
    successElement.textContent = message;
    successElement.style.display = 'block';
  }
}

function hideMessages() {
  const errorElement = document.getElementById('error-message');
  const successElement = document.getElementById('success-message');
  
  if (errorElement) errorElement.style.display = 'none';
  if (successElement) successElement.style.display = 'none';
}

// Logout function
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  authToken = null;
  currentUser = null;
  window.location.href = '../index.html';
}

// Get authenticated user
function getCurrentUser() {
  return currentUser;
}

// Get auth token
function getAuthToken() {
  return authToken;
}

// Check if user is authenticated
function isAuthenticated() {
  return !!authToken && !!currentUser;
}

// Make authenticated API calls
async function authenticatedFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle token expiration
  if (response.status === 401) {
    logout();
    return null;
  }

  return response;
}