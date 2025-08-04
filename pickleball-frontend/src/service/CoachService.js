import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

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

const CoachService = {
  getVenues: async () => {
    // Fetch venues for the current coach
    const res = await api.get('/api/coach/venues');
    return res.data;
  },
  getAllVenues: async () => {
    // Fetch all venues for dropdown
    const res = await api.get('/api/coach/all-venues');
    return res.data;
  },
  getAvailableCourts: async () => {
    const res = await api.get('/api/coach/available-courts');
    return res.data;
  },
  getCourtsByVenue: async (venueId) => {
    const res = await api.get(`/api/coach/courts-by-venue/${venueId}`);
    return res.data;
  },
  getAllCourts: async () => {
    const res = await api.get('/api/coach/all-courts');
    return res.data;
  },
  getTimeSlots: async () => {
    const res = await api.get('/api/coach/time-slots');
    return res.data;
  },
  getSchedule: async (start, end) => {
    const res = await api.get('/api/coach/schedule', {
      params: { start, end }
    });
    return res.data;
  },
  getScheduleWithRegistrations: async (start, end) => {
    const res = await api.get('/api/coach/schedule-with-registrations', {
      params: { start, end }
    });
    return res.data;
  },
  getDebugSessions: async () => {
    const res = await api.get('/api/coach/debug/sessions');
    return res.data;
  },
  getPublicSessions: async (start, end) => {
    const res = await api.get('/api/coach/public/sessions', {
      params: { start, end }
    });
    return res.data;
  },
  getDebugStatus: async () => {
    const res = await api.get('/api/coach/debug/status');
    return res.data;
  },
  createSlot: async (slotData) => {
    const res = await api.post('/api/coach/slots', slotData);
    return res.data;
  },
  getAvailableTimes: async (courtId, date) => {
    const res = await api.get('/api/coach/available-times', {
      params: { courtId, date }
    });
    return res.data;
  },

  // 获取教练的所有学生
  getAllStudents: async () => {
    const res = await api.get('/api/coach/students');
    return res.data;
  },

  // 获取教练的钱包交易记录
  getWalletTransactions: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await api.get('/api/coach/wallet-transactions', { params });
    return res.data;
  },

  // 获取教练的钱包余额
  getWalletBalance: async () => {
    const res = await api.get('/api/coach/wallet-balance');
    return res.data;
  }
};

export default CoachService; 