import api from '../api/axiosConfig';

const EventOrganizerService = {
  // Debug method to check authentication
  debugStatus: async () => {
    try {
      const response = await api.get('/event-organizer/debug/status');
      return response.data;
    } catch (error) {
      console.error('Error checking debug status:', error);
      throw error;
    }
  },

  // Dashboard methods
  getProfile: async () => {
    try {
      const response = await api.get('/event-organizer/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer profile:', error);
      throw error;
    }
  },

  getEvents: async () => {
    try {
      const response = await api.get('/event-organizer/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      throw error;
    }
  },

  getStatistics: async () => {
    try {
      const response = await api.get('/event-organizer/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer statistics:', error);
      throw error;
    }
  },

  getWallet: async () => {
    try {
      const response = await api.get('/event-organizer/wallet');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer wallet:', error);
      throw error;
    }
  },

  // Get available slots for a specific court
  getAvailableSlots: async (courtId, date) => {
    try {
      const response = await api.get('/events/organizer/available-slots', {
        params: { courtId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  // Get available slots for a court over a date range
  getAvailableSlotsRange: async (courtId, startDate, endDate) => {
    try {
      const response = await api.get('/events/organizer/available-slots-range', {
        params: { courtId, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots range:', error);
      throw error;
    }
  },

  // Get all slots for a court (including booked ones)
  getAllSlots: async (courtId, startDate, endDate) => {
    try {
      const response = await api.get('/events/organizer/all-slots', {
        params: { courtId, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all slots:', error);
      throw error;
    }
  },

  // Get time slots (hourly slots from 8 AM to 10 PM)
  getTimeSlots: async () => {
    try {
      const response = await api.get('/events/organizer/time-slots');
      return response.data;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  },

  // Get available times for a court on a specific date
  getAvailableTimes: async (courtId, date) => {
    try {
      const response = await api.get('/events/organizer/available-times', {
        params: { courtId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available times:', error);
      throw error;
    }
  },

  // Get available slots for a venue (all courts in the venue)
  getVenueAvailableSlots: async (venueId, date) => {
    try {
      const response = await api.get('/events/organizer/venue-available-slots', {
        params: { venueId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching venue available slots:', error);
      throw error;
    }
  },

  // Get available slots for multiple courts
  getAvailableSlotsForCourts: async (courtIds, date) => {
    try {
      const allSlots = [];
      for (const courtId of courtIds) {
        const courtSlots = await EventOrganizerService.getAvailableSlots(courtId, date);
        allSlots.push(...courtSlots);
      }
      return allSlots;
    } catch (error) {
      console.error('Error fetching available slots for courts:', error);
      throw error;
    }
  },

  // Get booked dates for a venue
  getVenueBookedDates: async (venueId, startDate, endDate, state) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (state) params.state = state;
      
      const response = await api.get('/events/organizer/venue-booked-dates', {
        params: { venueId, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching venue booked dates:', error);
      throw error;
    }
  },

  // Debug method to check slot data
  debugSlots: async (venueId, date) => {
    try {
      const response = await api.get('/events/organizer/debug/slots', {
        params: { venueId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error debugging slots:', error);
      throw error;
    }
  },

  // Generate slots for a specific date
  generateSlots: async (venueId, date) => {
    try {
      const response = await api.post('/events/organizer/generate-slots', null, {
        params: { venueId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating slots:', error);
      throw error;
    }
  }
};

export default EventOrganizerService; 