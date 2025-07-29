import axios from 'axios';
const api = axios.create({ baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const ClassSessionService = {
  createClassSession: async (data, makeupForSessionId) => {
    let url = '/api/class-sessions';
    if (makeupForSessionId) {
      url += `?makeupForSessionId=${makeupForSessionId}`;
    }
    const res = await api.post(url, data);
    return res.data;
  },

  // 查詢所有場館（給教練/用戶建立課程時用）
  getVenues: async () => {
    const res = await api.get('/api/venues');
    return res.data;
  },

  // 新增：建立 recurring 課程
  createRecurringSessions: async (data) => {
    const res = await api.post('/api/class-sessions/recurring', data);
    return res.data;
  },

  // 新增：court 多日期衝突檢查
  checkCourtAvailability: async (courtId, dateTimes) => {
    const res = await api.post('/api/class-sessions/check-court-availability', { courtId, dateTimes });
    return res.data;
  },

  // 新增：更新課程
  updateClassSession: async (sessionId, data) => {
    const res = await api.put(`/api/class-sessions/${sessionId}`, data);
    return res.data;
  },

  // Fetch all available class sessions for users
  getAllAvailableSessions: async (start, end) => {
    const res = await api.get('/api/class-sessions/available', {
      params: { start, end }
    });
    return res.data;
  },

  // Register for multiple sessions (group booking)
  registerForMultipleSessions: async (sessionIds, paymentMethod) => {
    const res = await api.post('/api/class-sessions/register-multi', {
      sessionIds,
      paymentMethod
    });
    return res.data;
  },

  // 批量查詢課程詳情（for receipt）
  getSessionDetailsBatch: async (sessionIds) => {
    const res = await api.post('/api/class-sessions/details-batch', sessionIds);
    return res.data;
  },

  getSessionStudents: async (sessionId) => {
    const res = await api.get(`/api/class-sessions/${sessionId}/students`);
    return res.data;
  },

  registerForSession: async (sessionId, userId) => {
    const res = await api.post(`/api/class-sessions/${sessionId}/register`, userId);
    return res.data;
  },

  // 查詢 recurring class 下所有 session 及其報名名單
  getRecurringClassFullDetails: async (recurringGroupId) => {
    const res = await api.get(`/api/class-sessions/recurring/${recurringGroupId}/full-details`);
    return res.data;
  },

  // 取消課程，支援 reason 和 force
  cancelSession: async (sessionId, reason = '', force = false) => {
    const params = [];
    if (force) params.push('force=true');
    if (reason) params.push('reason=' + encodeURIComponent(reason));
    const query = params.length ? '?' + params.join('&') : '';
    const res = await api.put(`/api/class-sessions/${sessionId}/cancel-registration${query}`);
    return res.data;
  },

  // 查詢單一課程詳情，支援 replacement class allowedMemberIds
  getSessionDetails: async (sessionId) => {
    const res = await api.get(`/api/class-sessions/${sessionId}/details`);
    return res.data;
  },

  // 查詢教練的替補課程
  getReplacementClasses: async (coachId) => {
    const res = await api.get('/api/class-sessions/replacements', {
      params: { coachId }
    });
    return res.data;
  },
};
export default ClassSessionService; 