import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

// Create a reusable axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add interceptors
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login?session_expired=true';
    }
    return Promise.reject(error);
  }
);

const CourtService = {
  getAllCourts: async () => {
    try {
      const response = await api.get('/api/member/courts');
      return response.data;
    } catch (error) {
      console.error('API Error in getAllCourts:', error);
      throw error;
    }
  },

  getCourtById: async (id) => {
    try {
      const response = await api.get(`/api/member/courts/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error in getCourtById:', error);
      throw error;
    }
  }
};

export default CourtService;