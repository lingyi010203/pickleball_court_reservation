import axios from 'axios'; // Add this import
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
  }
  
};

export default UserService;