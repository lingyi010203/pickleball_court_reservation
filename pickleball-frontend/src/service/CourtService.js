/**
 * CourtService.js
 * 
 * Centralized service for interacting with Court-related endpoints.
 * Uses a reusable axios instance with interceptors for auth.
 */

import axios from 'axios';


// Import the centralized api instance
import api from './api';

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
      const response = await api.get('/member/courts');
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
      const response = await api.get(`/member/courts/${id}`);
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
      const response = await api.get('/member/courts/booked');
      return response.data;
    } catch (error) {
      console.error('[CourtService] Error in getBookedCourts:', error);
      throw error;
    }
  },

  /**
   * Fetch available courts for a given date and time range.
   * @param {string} date - yyyy-MM-dd
   * @param {string} startTime - HH:mm
   * @param {string} endTime - HH:mm
   * @returns {Promise<Array>} List of available court objects
   */
  getAvailableCourts: async (date, startTime, endTime) => {
    try {
      const response = await api.get('/member/courts/available', {
        params: { date, startTime, endTime }
      });
      return response.data;
    } catch (error) {
      console.error('[CourtService] Error in getAvailableCourts:', error);
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
  
  const response = await api.post(`/admin/courts/${courtId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * 获取球场图片
 * @param {number} courtId
 * @returns {Promise<Array>}
 */
export const getCourtImages = async (courtId) => {
  const response = await api.get(`/admin/courts/${courtId}/images`);
  return response.data;
};

export const getCourtImagesPublic = async (courtId) => {
  const response = await api.get(`/admin/courts/public/${courtId}/images`);
  return response.data;
};


export default CourtService;
