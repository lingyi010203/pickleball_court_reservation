import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/member';

const BookingService = {
  bookCourt: async (bookingRequest) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE_URL}/bookings`, bookingRequest, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Return the actual data from the response
      return response.data;
      
    } catch (error) {
      let errorMessage = 'Network error. Please try again.';
      
      if (error.response) {
        // Handle different status codes
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Invalid booking request';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.status === 409) {
          errorMessage = error.response.data.message || 'Slot is no longer available';
        } else {
          errorMessage = error.response.data.message || 'Booking failed';
        }
      }
      
      throw new Error(errorMessage);
    }
  }
};

export default BookingService;