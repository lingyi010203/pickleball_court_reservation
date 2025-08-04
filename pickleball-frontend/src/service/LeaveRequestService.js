import api from './api';

const LeaveRequestService = {
  // 創建補課請求
  createLeaveRequest: async (data) => {
    const res = await api.post('/leave-requests', data);
    return res.data;
  },

  // 獲取教練的待處理請求
  getPendingRequestsByCoach: async (coachId) => {
    const res = await api.get('/leave-requests/coach/pending', {
      params: { coachId }
    });
    return res.data;
  },

  // 獲取教練的所有請求
  getAllRequestsByCoach: async (coachId) => {
    const res = await api.get('/leave-requests/coach/all', {
      params: { coachId }
    });
    return res.data;
  },

  // 獲取學生的所有請求
  getAllRequestsByStudent: async (studentId) => {
    const res = await api.get('/leave-requests/student', {
      params: { studentId }
    });
    return res.data;
  },

  // 批准請求
  approveRequest: async (requestId, replacementSessionId, coachNotes) => {
    const res = await api.put(`/leave-requests/${requestId}/approve`, {
      replacementSessionId,
      coachNotes
    });
    return res.data;
  },

  // 拒絕請求
  declineRequest: async (requestId, coachNotes) => {
    const res = await api.put(`/leave-requests/${requestId}/decline`, {
      coachNotes
    });
    return res.data;
  },

  // 獲取教練的待處理請求數量
  getPendingRequestCount: async (coachId) => {
    const res = await api.get('/leave-requests/coach/pending-count', {
      params: { coachId }
    });
    return res.data;
  },

  // 獲取可用的補課時間（排除已預約的課程）
  getAvailableReplacementSessions: async (coachId, studentId) => {
    const res = await api.get('/leave-requests/available-replacement-sessions', {
      params: { coachId, studentId }
    });
    return res.data;
  },

  // 調試：檢查教練課程數據
  debugCoachSessions: async (coachId) => {
    const res = await api.get('/leave-requests/debug/coach-sessions', {
      params: { coachId }
    });
    return res.data;
  },

  // 調試：檢查所有請假請求
  debugAllRequests: async () => {
    const res = await api.get('/leave-requests/debug/all-requests');
    return res.data;
  }
};

export default LeaveRequestService; 