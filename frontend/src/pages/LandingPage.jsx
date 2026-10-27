import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div>
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <h1>ALUMNI CONNECT</h1>
            <p className="tagline">Connect • Mentor • Grow</p>
          </div>
          <nav className="landing-nav">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <h2>Connect Students with Alumni & Faculty</h2>
          <p>Build meaningful connections, find mentorship opportunities, and grow your professional network with our alumni community.</p>
        </section>

        <section className="features-section">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Alumni Network</h3>
            <p>Connect with graduates across industries and locations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Mentorship</h3>
            <p>Get guidance from experienced alumni in your field</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Events</h3>
            <p>Participate in networking events and career talks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>Career Opportunities</h3>
            <p>Discover jobs and internships posted by alumni</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
