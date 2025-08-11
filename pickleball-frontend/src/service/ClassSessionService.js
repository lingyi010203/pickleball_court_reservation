import api from '../api/axiosConfig';

const ClassSessionService = {
  // 獲取課程會話列表
  getClassSessions: async (page = 0, size = 10, filters = {}) => {
    let url = '/class-sessions';
    const params = { page, size, ...filters };
    const res = await api.get(url, { params });
    return res.data;
  },

  // 獲取場地列表
  getVenues: async () => {
    const res = await api.get('/venues');
    return res.data;
  },

  // 創建重複課程會話
  createRecurringSessions: async (data) => {
    const res = await api.post('/class-sessions/recurring', data);
    return res.data;
  },

  // 檢查場地可用性
  checkCourtAvailability: async (courtId, dateTimes) => {
    const res = await api.post('/class-sessions/check-court-availability', { courtId, dateTimes });
    return res.data;
  },

  // 更新課程會話
  updateSession: async (sessionId, data) => {
    const res = await api.put(`/class-sessions/${sessionId}`, data);
    return res.data;
  },

  // 獲取可用的課程會話
  getAvailableSessions: async (page = 0, size = 10, filters = {}) => {
    const res = await api.get('/class-sessions/available', {
      params: { page, size, ...filters }
    });
    return res.data;
  },

  // 批量註冊課程
  registerMultipleSessions: async (sessionIds, userId) => {
    const res = await api.post('/class-sessions/register-multi', {
      sessionIds,
      userId
    });
    return res.data;
  },

  // 獲取批量課程詳情
  getBatchSessionDetails: async (sessionIds) => {
    const res = await api.post('/class-sessions/details-batch', sessionIds);
    return res.data;
  },

  // 獲取課程學生列表
  getSessionStudents: async (sessionId) => {
    const res = await api.get(`/class-sessions/${sessionId}/students`);
    return res.data;
  },

  // 註冊課程
  registerSession: async (sessionId, userId) => {
    const res = await api.post(`/class-sessions/${sessionId}/register`, userId);
    return res.data;
  },

  // 獲取重複課程組詳情
  getRecurringGroupDetails: async (recurringGroupId) => {
    const res = await api.get(`/class-sessions/recurring/${recurringGroupId}/full-details`);
    return res.data;
  },

  // 取消課程註冊
  cancelRegistration: async (sessionId, userId, reason = '') => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const res = await api.put(`/class-sessions/${sessionId}/cancel-registration${query}`);
    return res.data;
  },

  // 獲取課程詳情
  getSessionDetails: async (sessionId) => {
    const res = await api.get(`/class-sessions/${sessionId}/details`);
    return res.data;
  },

  // 獲取替補課程
  getReplacementSessions: async (filters = {}) => {
    const res = await api.get('/class-sessions/replacements', {
      params: filters
    });
    return res.data;
  },

  // 獲取所有可用的課程會話
  getAllAvailableSessions: async (start, end) => {
    const res = await api.get('/class-sessions/available', {
      params: { start, end }
    });
    return res.data;
  }
};

export default ClassSessionService; 