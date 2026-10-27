import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const EventsPage = () => {
  const { authToken } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const [upcomingData, pastData] = await Promise.all([
        api.get('/events/upcoming', authToken),
        api.get('/events/past', authToken),
      ]);

      setUpcomingEvents(Array.isArray(upcomingData) ? upcomingData : upcomingData?.events || []);
      setPastEvents(Array.isArray(pastData) ? pastData : pastData?.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async (eventId) => {
    try {
      const data = await api.post(`/events/${eventId}/register`, {}, authToken);
      if (data.success) {
        alert('Event registration successful!');
        loadEvents();
      } else {
        alert(data.message || 'Failed to register for event');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Network error. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Events">
      <div className="dashboard-grid">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p>No upcoming events.</p>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.eventId} className="list-item">
                <div className="list-item-info">
                  <h4>{event.title}</h4>
                  <p>{formatDate(event.eventDate)} • {event.venue}</p>
                  <p>Type: {event.type} • Capacity: {event.capacity}</p>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-primary" onClick={() => registerForEvent(event.eventId)}>
                    Register
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Past Events</h3>
          {pastEvents.length === 0 ? (
            <p>No past events.</p>
          ) : (
            pastEvents.map((event) => (
              <div key={event.eventId} className="list-item">
                <div className="list-item-info">
                  <h4>{event.title}</h4>
                  <p>{formatDate(event.eventDate)} • {event.venue}</p>
                  <p>Attendance: {event.attendanceCount}/{event.capacity}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EventsPage;
