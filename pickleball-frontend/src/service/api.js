import axios from 'axios';
import UserService from './UserService';

const api = axios.create({
  baseURL: 'http://localhost:8081/api'
});

api.interceptors.request.use(config => {
  // Check if this is an admin route
  const isAdminRoute = config.url?.startsWith('/admin/');
  
  // Use admin token for admin routes, regular token for other routes
  // For admin routes, try admin token first, then fall back to regular token
  const token = isAdminRoute ? (UserService.getAdminToken() || UserService.getToken()) : UserService.getToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Check if it's an admin route to determine which logout to call
      const isAdminRoute = error.config?.url?.startsWith('/admin/');
      if (isAdminRoute) {
        UserService.adminLogout();
        // Use React Router navigation instead of window.location.href
        // This will be handled by the component that receives the error
        console.log('Admin authentication failed - redirecting to login');
      } else {
        UserService.logout();
        // Use React Router navigation instead of window.location.href
        // This will be handled by the component that receives the error
        console.log('User authentication failed - redirecting to login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;