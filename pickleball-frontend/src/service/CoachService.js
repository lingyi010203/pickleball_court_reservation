import api from '../api/axiosConfig';

const CoachService = {
  getVenues: async () => {
    // Fetch venues for the current coach
    const res = await api.get('/coach/venues');
    return res.data;
  },
  getAllVenues: async () => {
    // Fetch all venues for dropdown
    const res = await api.get('/coach/all-venues');
    return res.data;
  },
  getAvailableCourts: async () => {
    const res = await api.get('/coach/available-courts');
    return res.data;
  },
  getCourtsByVenue: async (venueId) => {
    const res = await api.get(`/coach/courts-by-venue/${venueId}`);
    return res.data;
  },
  getAllCourts: async () => {
    const res = await api.get('/coach/all-courts');
    return res.data;
  },
  getTimeSlots: async () => {
    const res = await api.get('/coach/time-slots');
    return res.data;
  },
  getSchedule: async (start, end) => {
    const res = await api.get('/coach/schedule', {
      params: { start, end }
    });
    return res.data;
  },
  getScheduleWithRegistrations: async (start, end) => {
    const res = await api.get('/coach/schedule-with-registrations', {
      params: { start, end }
    });
    return res.data;
  },
  getDebugSessions: async () => {
    const res = await api.get('/coach/debug/sessions');
    return res.data;
  },
  getPublicSessions: async (start, end) => {
    const res = await api.get('/coach/public/sessions', {
      params: { start, end }
    });
    return res.data;
  },
  getDebugStatus: async () => {
    const res = await api.get('/coach/debug/status');
    return res.data;
  },
  createSlot: async (slotData) => {
    const res = await api.post('/coach/slots', slotData);
    return res.data;
  },
  getAvailableTimes: async (courtId, date) => {
    const res = await api.get('/coach/available-times', {
      params: { courtId, date }
    });
    return res.data;
  },

  // 获取教练的所有学生
  getAllStudents: async () => {
    const res = await api.get('/coach/students');
    return res.data;
  },

  // 获取教练的钱包交易记录
  getWalletTransactions: async (timestamp = '') => {
    const url = timestamp ? `/coach/wallet-transactions${timestamp}` : '/coach/wallet-transactions';
    const res = await api.get(url);
    return res.data;
  },

  // 获取教练的钱包余额
  getWalletBalance: async (timestamp = '') => {
    const url = timestamp ? `/coach/wallet-balance${timestamp}` : '/coach/wallet-balance';
    const res = await api.get(url);
    return res.data;
  }
};

export default CoachService; 