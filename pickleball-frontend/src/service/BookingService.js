import UserService from './UserService';
import api from './api';

const BookingService = {
  bookCourt: async (bookingRequest) => {
    try {
      const response = await api.post('/member/bookings', bookingRequest);
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
  },

  getAllAdminBookings: async (params = {}) => {
    try {
      const response = await api.get('/admin/dashboard/bookings', { params });
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to fetch admin bookings.';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  },

  cancelBooking: async (bookingId, adminRemark) => {
    try {
      let response;
      if (adminRemark !== undefined) {
        response = await api.put(`/admin/dashboard/bookings/${bookingId}/cancel`, { adminRemark });
      } else {
        response = await api.put(`/admin/dashboard/bookings/${bookingId}/cancel`, null);
      }
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to cancel booking.';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  },

  processCancelRequest: async (cancellationRequestId, action, adminRemark) => {
    try {
      const url = `/admin/cancellation-requests/${cancellationRequestId}/${action}`;
      console.log('Processing cancellation request:', { cancellationRequestId, action, adminRemark, url });
      const response = await api.put(url, { adminRemark });
      console.log('Cancellation request response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Cancellation request error:', error);
      let errorMessage = 'Failed to process cancellation request.';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }
};

export default BookingService;