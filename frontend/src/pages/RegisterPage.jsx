import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    registrationNumber: '',
    graduationYear: '',
    company: '',
    jobTitle: '',
    location: '',
    designation: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (new TextEncoder().encode(formData.password).length > 72) {
      setError('Password must be no more than 72 UTF-8 bytes');
      return;
    }

    // Build registration data based on role
    const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      department: formData.department,
    };

    // Add role-specific fields
    switch (formData.role) {
      case 'STUDENT':
        registrationData.registrationNumber = formData.registrationNumber;
        break;
      case 'ALUMNI':
        registrationData.graduationYear = parseInt(formData.graduationYear);
        registrationData.company = formData.company;
        registrationData.jobTitle = formData.jobTitle;
        registrationData.location = formData.location;
        break;
      case 'FACULTY':
        registrationData.designation = formData.designation;
        break;
    }

    setLoading(true);

    try {
      const data = await api.post('/auth/register', registrationData);

      if (data.success) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="auth-header">
        <h1>ALUMNI CONNECT</h1>
      </header>

      <main className="auth-container">
        <h2 className="auth-title">Create Account</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select your role</option>
              <option value="STUDENT">Student</option>
              <option value="ALUMNI">Alumni</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select department</option>
              <option value="Computer Science and Engineering">Computer Science and Engineering</option>
              <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
              <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
            </select>
          </div>

          {formData.role === 'STUDENT' && (
            <div className="form-group">
              <label htmlFor="registrationNumber">Registration Number</label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Enter your registration number"
                required
              />
            </div>
          )}

          {formData.role === 'ALUMNI' && (
            <>
              <div className="form-group">
                <label htmlFor="graduationYear">Graduation Year</label>
                <input
                  type="number"
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  placeholder="Enter graduation year"
                  min="1950"
                  max={new Date().getUTCFullYear() + 10}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Current company"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobTitle">Job Title</label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Current job title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Current location"
                />
              </div>
            </>
          )}

          {formData.role === 'FACULTY' && (
            <div className="form-group">
              <label htmlFor="designation">Designation</label>
              <select
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
              >
                <option value="">Select designation</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="HOD">Head of Department</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-success btn-block" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
