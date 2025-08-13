import api from './api';

const GroupService = {
  // Create a new group
  createGroup: async (groupName, description, memberUsernames) => {
    try {
      console.log('GroupService: Sending request to create group:', {
        groupName,
        description,
        memberUsernames
      });
      
      const response = await api.post('/groups/create', {
        groupName,
        description,
        memberUsernames
      });
      
      console.log('GroupService: Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('GroupService: Error creating group:', error);
      console.error('GroupService: Error response:', error.response?.data);
      throw error;
    }
  },

  // Get user's groups
  getUserGroups: async () => {
    try {
      const response = await api.get('/groups/my-groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }
  },

  // Get group by ID
  getGroupById: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  },

  // Get group members
  getGroupMembers: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  },

  // Add member to group
  addMemberToGroup: async (groupId, username) => {
    try {
      const response = await api.post(`/groups/${groupId}/members`, {
        username
      });
      return response.data;
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  },

  // Remove member from group
  removeMemberFromGroup: async (groupId, username) => {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${username}`);
      return response.data;
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  },

  // Get group messages
  getGroupMessages: async (groupId, page = 0, size = 50) => {
    try {
      const response = await api.get(`/groups/${groupId}/messages`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching group messages:', error);
      throw error;
    }
  },

  // Send message to group
  sendMessage: async (groupId, content, imageUrl = null) => {
    try {
      const response = await api.post(`/groups/${groupId}/messages`, {
        content,
        imageUrl
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (groupId, lastReadMessageId) => {
    try {
      const response = await api.post(`/groups/${groupId}/messages/read`, {
        lastReadMessageId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Delete group
  deleteGroup: async (groupId) => {
    try {
      const response = await api.delete(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  },

  // Search groups
  searchGroups: async (query) => {
    try {
      const response = await api.get('/groups/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching groups:', error);
      throw error;
    }
  },

  // Send group invitations (legacy endpoint)
  sendGroupInvitations: async (groupName, memberUsernames) => {
    try {
      const response = await api.post('/groups/send-invitations', {
        groupName,
        memberUsernames
      });
      return response.data;
    } catch (error) {
      console.error('Error sending group invitations:', error);
      throw error;
    }
  }
};

export default GroupService;
