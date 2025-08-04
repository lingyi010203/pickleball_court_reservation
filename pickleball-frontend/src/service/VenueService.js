import api from './api';

const VenueService = {
  getAllVenues: async () => {
    const response = await api.get('/venues');
    return response.data;
  },
  getVenuesByState: async (state) => {
    const response = await api.get(`/venues/bystate?state=${encodeURIComponent(state)}`);
    return response.data;
  },
  getVenues: async () => {
    const response = await api.get('/venues');
    return response.data;
  },
  checkVenueAvailability: async ({ venueId, date, startTime, endTime, peopleCount }) => {
    const response = await api.get(`/venues/check-availability`, {
      params: { venueId, date, startTime, endTime, peopleCount }
    });
    return response.data;
  }
};

export default VenueService; 