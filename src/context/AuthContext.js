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
        
        // Extract user information from token
        const user = {
          id: decodedToken.sub,
          username: decodedToken.username,
          email: decodedToken.email,
          role: decodedToken.role,
          token: authToken
        };
        
        setCurrentUser(user);
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
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return authToken !== null;
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return currentUser?.role === role;
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