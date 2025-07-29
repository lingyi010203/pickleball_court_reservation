import axios from 'axios'; // Add this import
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const TOKEN_KEY = 'authToken';
const USER_ROLE_KEY = 'userRole';
const USERNAME_KEY = 'username';
const PROFILE_IMAGE_KEY = 'profileImage';
const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USERNAME_KEY = 'adminUsername';


const UserService = {
  // Regular user methods
  login: (token, role, username, profileImage = null) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ROLE_KEY, role);
    localStorage.setItem(USERNAME_KEY, username);
    if (profileImage) {
      localStorage.setItem(PROFILE_IMAGE_KEY, profileImage);
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(PROFILE_IMAGE_KEY);
  },

  isLoggedIn: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRole: () => {
    return localStorage.getItem(USER_ROLE_KEY) || 'User';
  },

  isAdmin: () => {
    return localStorage.getItem(USER_ROLE_KEY) === 'ADMIN';
  },

  getUsername: () => {
    return localStorage.getItem(USERNAME_KEY) || '';
  },

  // Profile image handling
  setProfileImage: (image) => {
    if (image) {
      localStorage.setItem(PROFILE_IMAGE_KEY, image);
    } else {
      localStorage.removeItem(PROFILE_IMAGE_KEY);
    }
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('profileImageChanged', {
      detail: { profileImage: image }
    }));
  },

  getProfileImage: () => {
    return localStorage.getItem(PROFILE_IMAGE_KEY);
  },

  // Admin methods
  adminLogin: (token, username) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USERNAME_KEY, username);
  },

  adminLogout: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USERNAME_KEY);
  },

  isAdminLoggedIn: () => {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  getAdminToken: () => {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  getAdminUsername: () => {
    return localStorage.getItem(ADMIN_USERNAME_KEY) || '';
  },

  // Add this new method for fetching redemption history
  getRedeemHistory: async () => {
    const token = UserService.getToken();
    const response = await axios.get('http://localhost:8081/api/member/redeem-history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getUserProfileByUsername: async (username) => {
    const token = UserService.getToken();
    const response = await axios.get(`${API_URL}/api/users/profile/${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getMessages: async (username) => {
    const token = UserService.getToken();
    const response = await axios.get(`${API_URL}/api/messages/${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getConversations: async () => {
    const token = UserService.getToken();
    // This endpoint needs to be implemented in the backend
    const response = await axios.get(`${API_URL}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // New method to send a message via WebSocket
  sendMessage: (stompClient, message) => {
    if (stompClient && stompClient.connected) {
      stompClient.send('/app/private-message', {}, JSON.stringify(message));
    }
  },

  // UserService.js
  searchUsers: async (query) => {
    const token = UserService.getToken();
    try {
      const response = await axios.get(`${API_URL}/api/users/search`, {
        params: { query },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data ||
        "Failed to search users";
      throw new Error(message);
    }
  },

  addFriend: async (username) => {
    const token = UserService.getToken();
    try {
      const response = await axios.post(
        `${API_URL}/api/friends/add`,
        { username },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data ||
        error.message;
      throw new Error(message);
    }
  },

  getCurrentUser: async () => {
    const token = UserService.getToken();
    const response = await axios.get(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

sendFriendRequest: async (receiverUsername) => {
  const token = UserService.getToken();
  const senderUsername = UserService.getUsername();
  try {
    const response = await axios.post(
      `${API_URL}/api/users/friend-request`,
      null,
      {
        params: { senderUsername, receiverUsername },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    let errorMessage = "Failed to send friend request";

    if (error.response) {
      // Use backend error message if available
      errorMessage = error.response.data || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
},
  acceptFriendRequest: async (senderUsername) => {
    const token = UserService.getToken();
    const response = await axios.post(
      `${API_URL}/api/users/accept-friend`,
      null,
      {
        params: {
          receiverUsername: UserService.getUsername(),
          senderUsername
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

    getFriendRequests: async () => {
      const token = UserService.getToken();
      const currentUser = await axios.get(
        `${API_URL}/api/users/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Return users who added current user but not accepted yet
      return currentUser.data.friends.filter(friend =>
        !friend.friends.some(f => f.username === currentUser.data.username)
      );
    }
}

export default UserService;