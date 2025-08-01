import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('authToken') || null;
  });
  
  const [currentUser, setCurrentUser] = useState(null);

  // Decode token and set current user on initial load and when token changes
  useEffect(() => {
    if (authToken) {
      try {
        // Decode JWT to get user information
        const decodedToken = jwtDecode(authToken);
        console.log('Decoded JWT token:', decodedToken); // 調試日誌
        
        // Extract user information from token
        const role = decodedToken.role || '';
        // Remove "ROLE_" prefix if present
        const cleanRole = role.startsWith('ROLE_') ? role.substring(5) : role;
        

        
        const user = {
          id: decodedToken.userId || decodedToken.sub, // 優先使用 userId，如果沒有則使用 sub
          username: decodedToken.username || decodedToken.name || decodedToken.sub,
          email: decodedToken.email,
          role: cleanRole,
          userType: decodedToken.userType || cleanRole, // 優先使用 userType，如果沒有則使用 role
          token: authToken
        };
        
        console.log('Created user object:', user); // 調試日誌
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to decode token:', error);
        logout();
      }
    } else {
      setCurrentUser(null);
    }
  }, [authToken]);

  const login = (token) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return authToken !== null;
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!currentUser) return false;
    // 檢查 role 和 userType
    return currentUser.role === role || currentUser.userType === role;
  };

  return (
    <AuthContext.Provider value={{ 
      authToken, 
      currentUser,
      login, 
      logout,
      isAuthenticated,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};