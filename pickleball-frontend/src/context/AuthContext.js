import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => {
    // Check for both regular user token and admin token
    const userToken = localStorage.getItem('authToken');
    const adminToken = localStorage.getItem('adminToken');
    
    console.log('AuthContext initialization:', {
      userToken: !!userToken,
      adminToken: !!adminToken,
      adminUsername: localStorage.getItem('adminUsername')
    });
    
    // If we have an admin token, use it
    if (adminToken) {
      console.log('Using admin token for initialization');
      return adminToken;
    }
    
    // Otherwise use user token
    console.log('Using user token for initialization');
    return userToken || null;
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    // Try to restore currentUser from localStorage on initial load
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    return null;
  });

  // Decode token and set current user on initial load and when token changes
  useEffect(() => {
    console.log('AuthContext useEffect triggered with authToken:', !!authToken);
    
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
          username: decodedToken.username || decodedToken.sub, // 優先使用 username，如果沒有則使用 sub
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
        // Don't logout immediately on decode error, try to restore from localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setCurrentUser(parsedUser);
            console.log('Restored user from localStorage:', parsedUser);
          } catch (parseError) {
            console.error('Failed to parse saved user:', parseError);
            logout();
          }
        } else {
          console.log('No saved user found, logging out');
          logout();
        }
      }
    } else {
      console.log('No authToken, setting currentUser to null');
      setCurrentUser(null);
    }
  }, [authToken]);

  const login = (token, isAdmin = false) => {
    if (isAdmin) {
      localStorage.setItem('adminToken', token);
    } else {
      localStorage.setItem('authToken', token);
    }
    setAuthToken(token);
  };

  const logout = () => {
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('currentUser');
    
    // Clear state
    setAuthToken(null);
    setCurrentUser(null);
    
    console.log('Logged out - cleared all auth data');
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