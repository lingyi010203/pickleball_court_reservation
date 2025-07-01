const AuthService = {
  // Save tokens to localStorage
  setTokens: (token) => {
    localStorage.setItem('accessToken', token);
  },

  // Get access token from localStorage
  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Remove tokens from localStorage (logout)
  removeTokens: () => {
    localStorage.removeItem('accessToken');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Get user role from token (if needed)
  getUserRole: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      // Decode JWT token to get payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
};

export default AuthService;