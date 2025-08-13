import api from '../api/axiosConfig';

class GroupService {
  constructor() {
    // No need to set baseURL as it's handled by axios instance
  }

  /**
   * Create a new group
   * @param {string} name - Group name
   * @param {string} description - Group description
   * @param {Array<string>} memberUsernames - Array of usernames to add to the group
   * @returns {Promise<Object>} - Created group data
   */
  async createGroup(name, description, memberUsernames) {
    try {
      const response = await api.post('/groups', {
        name,
        description,
        memberUsernames
      });
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  /**
   * Get all groups for the current user
   * @returns {Promise<Array>} - Array of groups
   */
  async getUserGroups() {
    try {
      const response = await api.get('/groups/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }
  }

  /**
   * Get a specific group by ID
   * @param {number} groupId - Group ID
   * @returns {Promise<Object>} - Group data
   */
  async getGroupById(groupId) {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  /**
   * Add members to an existing group
   * @param {number} groupId - Group ID
   * @param {Array<string>} memberUsernames - Array of usernames to add
   * @returns {Promise<Object>} - Updated group data
   */
  async addMembersToGroup(groupId, memberUsernames) {
    try {
      const response = await api.post(`/groups/${groupId}/members`, {
        memberUsernames
      });
      return response.data;
    } catch (error) {
      console.error('Error adding members to group:', error);
      throw error;
    }
  }

  /**
   * Remove members from a group
   * @param {number} groupId - Group ID
   * @param {Array<string>} memberUsernames - Array of usernames to remove
   * @returns {Promise<Object>} - Updated group data
   */
  async removeMembersFromGroup(groupId, memberUsernames) {
    try {
      const response = await api.delete(`/groups/${groupId}/members`, {
        data: { memberUsernames }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing members from group:', error);
      throw error;
    }
  }

  /**
   * Update group information
   * @param {number} groupId - Group ID
   * @param {Object} updateData - Data to update (name, description)
   * @returns {Promise<Object>} - Updated group data
   */
  async updateGroup(groupId, updateData) {
    try {
      const response = await api.put(`/groups/${groupId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  /**
   * Delete a group
   * @param {number} groupId - Group ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteGroup(groupId) {
    try {
      const response = await api.delete(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  /**
   * Leave a group
   * @param {number} groupId - Group ID
   * @returns {Promise<Object>} - Result of leaving the group
   */
  async leaveGroup(groupId) {
    try {
      const response = await api.post(`/groups/${groupId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }
}

export default new GroupService();
