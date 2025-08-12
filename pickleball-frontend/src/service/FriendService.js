// src/services/friendService.js
import api from '../api/axiosConfig';

export default {
  getPendingRequests: async () => {
    const response = await api.get('/friends/requests/pending');
    return response.data;
  },
  
  acceptRequest: async (requestId) => {
    await api.post(`/friends/accept/${requestId}`);
  },
  
  declineRequest: async (requestId) => {
    await api.post(`/friends/decline/${requestId}`);
  },
  
  getFriends: async () => {
    const response = await api.get('/friends/accepted');
    return response.data;
  },
  
  sendRequest: async (receiverUsername) => {
    await api.post('/friends/request', null, { 
      params: { receiverUsername } 
    });
  },
  
  checkFriendship: async (otherUsername) => {
    const response = await api.get('/friends/check', { 
      params: { otherUsername } 
    });
    return response.data;
  }
};