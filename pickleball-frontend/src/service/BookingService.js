import axios from 'axios';
import UserService from './UserService';

const API_BASE_URL = 'http://localhost:8081/api/member';
const ADMIN_API_BASE_URL = 'http://localhost:8081/api/admin/dashboard';

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
  },

  getAllAdminBookings: async (params = {}) => {
    try {
      const token = UserService.getAdminToken ? UserService.getAdminToken() : localStorage.getItem('adminToken');
      const response = await axios.get(`${ADMIN_API_BASE_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params // 关键：把排序、分页等参数传递给后端
      });
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
      const token = UserService.getAdminToken ? UserService.getAdminToken() : localStorage.getItem('adminToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      let response;
      if (adminRemark !== undefined) {
        response = await axios.put(`${ADMIN_API_BASE_URL}/bookings/${bookingId}/cancel`, { adminRemark }, config);
      } else {
        response = await axios.put(`${ADMIN_API_BASE_URL}/bookings/${bookingId}/cancel`, null, config);
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
      const token = UserService.getAdminToken ? UserService.getAdminToken() : localStorage.getItem('adminToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const url = `/api/admin/cancellation-requests/${cancellationRequestId}/${action}`; // 修正为实际后端路由
      const response = await axios.put(url, { adminRemark }, config);
      return response.data;
    } catch (error) {
      let errorMessage = 'Failed to process cancellation request.';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }
};

export default BookingService;