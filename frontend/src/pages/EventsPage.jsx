import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const parseEventDate = (value) => {
  if (!value) return null;
  const dateValue = new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue;
};

const EventsPage = () => {
  const { authToken, currentUser } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventDate: '',
    venue: '',
    type: 'Networking',
    capacity: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setErrorMessage('');
    try {
      const eventsData = await api.get('/events', authToken);
      const events = Array.isArray(eventsData) ? eventsData : eventsData?.events || [];
      const now = new Date();
      setUpcomingEvents(events.filter((event) => {
        const eventDate = parseEventDate(event.eventDate);
        return eventDate && eventDate >= now;
      }));
      setPastEvents(events.filter((event) => {
        const eventDate = parseEventDate(event.eventDate);
        return eventDate && eventDate < now;
      }));

      if (currentUser?.role === 'ALUMNI') {
        const registrationsData = await api.get('/events/my-registrations', authToken);
        setMyRegistrations(Array.isArray(registrationsData) ? registrationsData : registrationsData?.registrations || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setErrorMessage(error.message || 'Failed to load events.');
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
      if (error.status === 403) {
        alert('Only alumni can register for events.');
      } else if (error.status === 409) {
        alert('Event is full or you are already registered.');
      } else {
        alert(error.message || 'Failed to register for the event.');
      }
    }
  };

  const cancelRegistration = async (registrationId) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;

    try {
      const data = await api.delete(`/events/registrations/${registrationId}`, authToken);
      if (data.success) {
        alert('Registration cancelled successfully!');
        loadEvents();
      } else {
        alert(data.message || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert(error.message || 'Failed to cancel event registration.');
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        eventDate: new Date(eventForm.eventDate).toISOString(),
        capacity: eventForm.capacity === '' ? null : Number(eventForm.capacity),
      };
      const data = await api.post('/events', payload, authToken);
      if (data.success) {
        alert('Event created successfully!');
        setEventForm({
          title: '',
          description: '',
          eventDate: '',
          venue: '',
          type: 'Networking',
          capacity: '',
        });
        setShowAddForm(false);
        loadEvents();
      } else {
        alert(data.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      if (error.status === 403) {
        alert('You do not have permission to create events.');
      } else {
        alert(error.message || 'Failed to create event.');
      }
    }
  };

  const updateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const payload = {
        ...eventForm,
        eventDate: new Date(eventForm.eventDate).toISOString(),
        capacity: eventForm.capacity === '' ? null : Number(eventForm.capacity),
      };
      const data = await api.put(`/events/${editingEvent.eventId}`, payload, authToken);
      if (data.success) {
        alert('Event updated successfully!');
        setEditingEvent(null);
        setEventForm({
          title: '',
          description: '',
          eventDate: '',
          venue: '',
          type: 'Networking',
          capacity: '',
        });
        setShowAddForm(false);
        loadEvents();
      } else {
        alert(data.message || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      if (error.status === 403) {
        alert('You do not have permission to update this event.');
      } else {
        alert(error.message || 'Failed to update event.');
      }
    }
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const data = await api.delete(`/events/${eventId}`, authToken);
      if (data.success) {
        alert('Event deleted successfully!');
        loadEvents();
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      if (error.status === 403) {
        alert('You do not have permission to delete this event.');
      } else {
        alert(error.message || 'Failed to delete event.');
      }
    }
  };

  const handleEdit = (event) => {
    const dateValue = parseEventDate(event.eventDate);
    if (dateValue && !Number.isNaN(dateValue.getTime())) {
      dateValue.setMinutes(dateValue.getMinutes() - dateValue.getTimezoneOffset());
    }
    const localDateValue = dateValue && !Number.isNaN(dateValue.getTime())
      ? dateValue.toISOString().slice(0, 16)
      : '';

    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      eventDate: localDateValue,
      venue: event.venue,
      type: event.type,
      capacity: event.capacity || '',
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setShowAddForm(false);
    setEventForm({
      title: '',
      description: '',
      eventDate: '',
      venue: '',
      type: 'Networking',
      capacity: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = parseEventDate(dateString);
    if (!date) return 'TBD';
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
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Upcoming Events</h3>
            {(currentUser?.role === 'FACULTY' || currentUser?.role === 'ADMIN') && (
              <button className="btn btn-primary" onClick={showAddForm ? handleCancel : () => setShowAddForm(true)}>
                {showAddForm ? 'Cancel' : 'Create Event'}
              </button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={editingEvent ? updateEvent : createEvent} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="eventDate">Event Date</label>
                <input
                  type="datetime-local"
                  id="eventDate"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="venue">Venue</label>
                <input
                  type="text"
                  id="venue"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  required
                >
                  <option value="Networking">Networking</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Reunion">Reunion</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="capacity">Capacity (optional)</label>
                <input
                  type="number"
                  id="capacity"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                  min="1"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-success">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {upcomingEvents.length === 0 ? (
            <p>No upcoming events.</p>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.eventId} className="list-item">
                <div className="list-item-info">
                  <h4>{event.title}</h4>
                  <p>{formatDate(event.eventDate)} • {event.venue}</p>
                  <p>Type: {event.type} • Capacity: {event.capacity ?? 'Unlimited'}</p>
                  <p>Registered: {event.registrationCount || 0}/{event.capacity ?? 'Unlimited'}</p>
                  {event.status === 'PENDING' && <span style={{ color: '#f59e0b', fontWeight: '600' }}>Pending Approval</span>}
                </div>
                <div className="list-item-actions">
                  {currentUser?.role === 'ALUMNI' && event.status === 'APPROVED' && (
                    <>
                      {event.isRegistered ? (
                        <span className="verified-badge">Registered</span>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => registerForEvent(event.eventId)}
                          disabled={event.capacity != null && (event.registrationCount || 0) >= event.capacity}
                        >
                          Register
                        </button>
                      )}
                    </>
                  )}
                  {(currentUser?.role === 'ADMIN' || (currentUser?.role === 'FACULTY' && event.isCreator)) && (
                    <>
                      <button className="btn btn-secondary" onClick={() => handleEdit(event)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteEvent(event.eventId)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {currentUser?.role === 'ALUMNI' && (
          <div className="card">
            <h3>My Registrations</h3>
            {myRegistrations.length === 0 ? (
              <p>No event registrations yet.</p>
            ) : (
              myRegistrations.map((registration) => (
                <div key={registration.registrationId} className="list-item">
                  <div className="list-item-info">
                    <h4>{registration.eventTitle}</h4>
                    <p>{formatDate(registration.eventDate)} • {registration.venue}</p>
                    <p>Registered: {new Date(registration.registeredAt).toLocaleDateString()}</p>
                  </div>
                  <div className="list-item-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => cancelRegistration(registration.registrationId)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

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
                  <p>Registrations: {event.registrationCount || 0}/{event.capacity ?? 'Unlimited'}</p>
                </div>
                {(currentUser?.role === 'ADMIN' || (currentUser?.role === 'FACULTY' && event.isCreator)) && (
                  <div className="list-item-actions">
                    <button className="btn btn-secondary" onClick={() => handleEdit(event)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => deleteEvent(event.eventId)}>Delete</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EventsPage;
