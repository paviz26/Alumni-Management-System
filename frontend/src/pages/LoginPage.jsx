import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      redirectBasedOnRole(currentUser.role);
    }
  }, [isAuthenticated, currentUser]);

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case 'STUDENT':
        navigate('/student-dashboard');
        break;
      case 'ALUMNI':
        navigate('/alumni-dashboard');
        break;
      case 'FACULTY':
        navigate('/faculty-dashboard');
        break;
      case 'ADMIN':
        navigate('/admin-dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });

      if (data.success) {
        login(data.token, data.user);
        setSuccess('Login successful! Redirecting to dashboard...');
        setTimeout(() => {
          redirectBasedOnRole(data.user.role);
        }, 1500);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
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
        <h2 className="auth-title">Login</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-success btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-links">
          <p><a href="#" id="forgot-password">Forgot password?</a></p>
          <p>New user? <Link to="/register">Register</Link></p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
