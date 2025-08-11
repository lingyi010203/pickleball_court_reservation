/**
 * UserTypeChangeRequestService.js
 * 
 * Service for managing user type change requests with enhanced functionality.
 * Uses a reusable axios instance with interceptors for auth.
 */

import api from './api';

const UserTypeChangeRequestService = {
  /**
   * Fetch all requests with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated requests data
   */
  getRequests: async (params = {}) => {
    try {
      const response = await api.get('/admin/user-type-requests', { params });
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in getRequests:', error);
      throw error;
    }
  },

  /**
   * Fetch pending requests (for backward compatibility)
   * @returns {Promise<Array>} List of pending requests
   */
  getPendingRequests: async () => {
    try {
      const response = await api.get('/admin/user-type-requests/pending');
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in getPendingRequests:', error);
      throw error;
    }
  },

  /**
   * Get request by ID
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Request details
   */
  getRequestById: async (requestId) => {
    try {
      const response = await api.get(`/admin/user-type-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in getRequestById:', error);
      throw error;
    }
  },

  /**
   * Get requests by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of user requests
   */
  getRequestsByUserId: async (userId) => {
    try {
      const response = await api.get(`/admin/user-type-requests/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in getRequestsByUserId:', error);
      throw error;
    }
  },

  /**
   * Process a request (approve/reject)
   * @param {number} requestId - Request ID
   * @param {Object} data - Process data
   * @returns {Promise<Object>} Updated request
   */
  processRequest: async (requestId, data) => {
    try {
      const response = await api.put(`/admin/user-type-requests/${requestId}/process`, data);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in processRequest:', error);
      throw error;
    }
  },

  /**
   * Batch process requests
   * @param {Object} data - Batch process data
   * @returns {Promise<Array>} List of processed requests
   */
  batchProcessRequests: async (data) => {
    try {
      const response = await api.put('/admin/user-type-requests/batch-process', data);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in batchProcessRequests:', error);
      throw error;
    }
  },

  /**
   * Cancel a request
   * @param {number} requestId - Request ID
   * @param {Object} data - Cancel data
   * @returns {Promise<Object>} Updated request
   */
  cancelRequest: async (requestId, data) => {
    try {
      const response = await api.put(`/admin/user-type-requests/${requestId}/cancel`, data);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in cancelRequest:', error);
      throw error;
    }
  },

  /**
   * Get request statistics
   * @returns {Promise<Object>} Statistics data
   */
  getRequestStatistics: async () => {
    try {
      const response = await api.get('/admin/user-type-requests/statistics');
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in getRequestStatistics:', error);
      throw error;
    }
  },

  /**
   * Check if user has pending request
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Has pending status
   */
  hasPendingRequest: async (userId) => {
    try {
      const response = await api.get(`/admin/user-type-requests/user/${userId}/has-pending`);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in hasPendingRequest:', error);
      throw error;
    }
  },

  /**
   * Get latest pending request for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Latest pending request
   */
  getLatestPendingRequest: async (userId) => {
    try {
      const response = await api.get(`/admin/user-type-requests/user/${userId}/latest-pending`);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in getLatestPendingRequest:', error);
      throw error;
    }
  },

  /**
   * Update request notes
   * @param {number} requestId - Request ID
   * @param {Object} data - Notes data
   * @returns {Promise<Object>} Updated request
   */
  updateRequestNotes: async (requestId, data) => {
    try {
      const response = await api.put(`/admin/user-type-requests/${requestId}/notes`, data);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in updateRequestNotes:', error);
      throw error;
    }
  },

  /**
   * Delete request
   * @param {number} requestId - Request ID
   * @returns {Promise<void>}
   */
  deleteRequest: async (requestId) => {
    try {
      await api.delete(`/admin/user-type-requests/${requestId}`);
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in deleteRequest:', error);
      throw error;
    }
  },

  /**
   * Export requests
   * @param {Object} params - Export parameters
   * @returns {Promise<Blob>} Export data
   */
  exportRequests: async (params = {}) => {
    try {
      const response = await api.get('/admin/user-type-requests/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in exportRequests:', error);
      throw error;
    }
  },

  /**
   * Create a new request (for users)
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Created request
   */
  createRequest: async (data) => {
    try {
      const response = await api.post('/admin/user-type-requests', data);
      return response.data;
    } catch (error) {
      console.error('[UserTypeChangeRequestService] Error in createRequest:', error);
      throw error;
    }
  }
};

export default UserTypeChangeRequestService;
