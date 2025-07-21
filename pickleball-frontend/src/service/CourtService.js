/**
 * CourtService.js
 * 
 * Centralized service for interacting with Court-related endpoints.
 * Uses a reusable axios instance with interceptors for auth.
 */

import axios from 'axios';


// Base URL for backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

// Create a reusable Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Add request interceptor to include Bearer token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle global auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('authToken');
      window.location.href = '/login?session_expired=true';
    }
    return Promise.reject(error);
  }
);

// -----------------------------
// CourtService Methods
// -----------------------------

const CourtService = {
  /**
   * Fetch all courts for the member view.
   * Automatically attaches auth header via axios instance.
   * @returns {Promise<Array>} List of court objects
   */
  getAllCourts: async () => {
    try {
      const response = await api.get('/api/member/courts');
      return response.data;
    } catch (error) {
      console.error('[CourtService] Error in getAllCourts:', error);
      throw error;
    }
  },

  /**
   * Fetch details for a single court by ID.
   * @param {string|number} id - The court ID
   * @returns {Promise<Object>} Court details
   */
  getCourtById: async (id) => {
    try {
      const response = await api.get(`/api/member/courts/${id}`);
      return response.data;
    } catch (error) {
      console.error('[CourtService] Error in getCourtById:', error);
      throw error;
    }
  },

  /**
   * Fetch courts that the current user has booked.
   * @returns {Promise<Array>} List of court objects
   */
  getBookedCourts: async () => {
    try {
      const response = await api.get('/api/member/courts/booked');
      return response.data;
    } catch (error) {
      console.error('[CourtService] Error in getBookedCourts:', error);
      throw error;
    }
  }
};

/**
 * 上传球场图片
 * @param {number} courtId
 * @param {File} file
 * @returns {Promise<Object>}
 */
export const uploadCourtImage = async (courtId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('adminToken');
  const response = await api.post(`/api/admin/courts/${courtId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
  });
  return response.data;
};

/**
 * 获取球场图片
 * @param {number} courtId
 * @returns {Promise<Array>}
 */
export const getCourtImages = async (courtId) => {
  const token = localStorage.getItem('adminToken');
  const response = await api.get(`/api/admin/courts/${courtId}/images`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getCourtImagesPublic = async (courtId) => {
  const response = await api.get(`/api/admin/courts/public/${courtId}/images`);
  return response.data;
};


export default CourtService;
