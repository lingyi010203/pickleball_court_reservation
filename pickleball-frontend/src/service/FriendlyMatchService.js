import api from '../api/axiosConfig';

const FriendlyMatchService = {
  // 創建友好比賽
  createMatch: async (matchData) => {
    try {
      const res = await api.post('/friendly-matches/create', matchData);
      return res.data;
    } catch (error) {
      console.error('Error creating friendly match:', error);
      throw error;
    }
  },

  // 獲取邀請列表
  getInvitations: async () => {
    try {
      const res = await api.get('/friendly-matches/invitations');
      return res.data;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  },

  // 加入比賽
  joinMatch: async (matchId) => {
    try {
      const res = await api.post(`/friendly-matches/invitation/${matchId}/join`);
      return res.data;
    } catch (error) {
      console.error('Error joining match:', error);
      throw error;
    }
  },

  // 發送邀請
  sendInvitation: async (invitationData) => {
    try {
      const res = await api.post('/friendly-matches/invitation', invitationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return res.data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  },

  // 取消加入請求
  cancelJoin: async (requestId, memberId) => {
    try {
      const res = await api.delete(`/friendly-matches/requests/${requestId}`);
      return res.data;
    } catch (error) {
      console.error('Error canceling join request:', error);
      throw error;
    }
  }
};

export default FriendlyMatchService; 