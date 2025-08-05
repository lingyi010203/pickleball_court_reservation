import api from './api';

class EventService {
  // Get all upcoming events
  static async getUpcomingEvents(page = 0, size = 9) {
    try {
      const response = await api.get('/events/upcoming', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get event details by ID
  static async getEventDetails(eventId) {
    try {
      const response = await api.get(`/events/${eventId}/details`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Create a new event
  static async createEvent(eventData) {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update an existing event
  static async updateEvent(eventId, eventData) {
    try {
      const response = await api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update event with notification
  static async updateEventWithNotification(eventId, eventData) {
    try {
      const response = await api.put(`/events/${eventId}/notify`, eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete an event
  static async deleteEvent(eventId) {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Publish an event
  static async publishEvent(eventId) {
    try {
      const response = await api.post(`/events/${eventId}/publish`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get events by type
  static async getEventsByType(eventType) {
    try {
      const response = await api.get(`/events/type/${eventType}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get events by skill level
  static async getEventsBySkillLevel(skillLevel) {
    try {
      const response = await api.get(`/events/skill/${skillLevel}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Browse events with filters
  static async browseEvents(filters) {
    try {
      const response = await api.get('/events/browse', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get available event types
  static async getAvailableEventTypes() {
    try {
      const response = await api.get('/events/types');
      return response.data;
    } catch (error) {
      throw error;
    }
  }



  // Get event statistics
  static async getEventStats() {
    try {
      const response = await api.get('/events/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is registered for an event
  static async isRegisteredForEvent(eventId) {
    try {
      const response = await api.get(`/event-registration/is-registered/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Register for an event
  static async registerForEvent(eventId) {
    try {
      const response = await api.post('/event-registration/register', { eventId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Cancel event registration
  static async cancelEventRegistration(eventId) {
    try {
      const response = await api.delete(`/event-registration/cancel/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default EventService; 