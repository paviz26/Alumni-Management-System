const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener('DOMContentLoaded', function() {
  const roleSelect = document.getElementById('role');
  const studentFields = document.getElementById('student-fields');
  const alumniFields = document.getElementById('alumni-fields');
  const facultyFields = document.getElementById('faculty-fields');
  const registerForm = document.getElementById('register-form');
  const registerBtn = document.getElementById('register-btn');

  // Handle role selection to show/hide relevant fields
  roleSelect.addEventListener('change', function() {
    const role = this.value;
    
    // Hide all role-specific fields
    studentFields.style.display = 'none';
    alumniFields.style.display = 'none';
    facultyFields.style.display = 'none';

    // Show relevant fields based on role
    switch(role) {
      case 'STUDENT':
        studentFields.style.display = 'block';
        // Make student fields required
        document.getElementById('registrationNumber').required = true;
        break;
      case 'ALUMNI':
        alumniFields.style.display = 'block';
        // Make alumni fields required
        document.getElementById('graduationYear').required = true;
        document.getElementById('company').required = true;
        document.getElementById('jobTitle').required = true;
        break;
      case 'FACULTY':
        facultyFields.style.display = 'block';
        // Make faculty fields required
        document.getElementById('designation').required = true;
        break;
      default:
        // Remove required attributes when no role selected
        document.getElementById('registrationNumber').required = false;
        document.getElementById('graduationYear').required = false;
        document.getElementById('company').required = false;
        document.getElementById('jobTitle').required = false;
        document.getElementById('designation').required = false;
    }
  });

  // Handle form submission
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get common fields
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value;

    // Client-side validation
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    // Build registration data based on role
    const registrationData = {
      firstName,
      lastName,
      email,
      password,
      role,
      department
    };

    // Add role-specific fields
    switch(role) {
      case 'STUDENT':
        registrationData.registrationNumber = document.getElementById('registrationNumber').value;
        break;
      case 'ALUMNI':
        registrationData.graduationYear = parseInt(document.getElementById('graduationYear').value);
        registrationData.company = document.getElementById('company').value;
        registrationData.jobTitle = document.getElementById('jobTitle').value;
        registrationData.location = document.getElementById('location').value;
        break;
      case 'FACULTY':
        registrationData.designation = document.getElementById('designation').value;
        break;
    }

    // Show loading state
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';
    hideMessages();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Account created successfully! Redirecting to login...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);

      } else {
        showError(data.message || 'Registration failed. Please try again.');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
      }
    } catch (error) {
      console.error('Registration error:', error);
      showError('Network error. Please check your connection and try again.');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Create Account';
    }
  });
});

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