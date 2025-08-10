import axios from 'axios';
import UserService from './UserService';

const api = axios.create({
  baseURL: 'http://localhost:8081/api'
});

api.interceptors.request.use(config => {
  // Check if this is an admin route
  const isAdminRoute = config.url?.startsWith('/admin/');
  
  // Use admin token for admin routes, regular token for other routes
  const token = isAdminRoute ? UserService.getAdminToken() : UserService.getToken();
  
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
        window.location.href = '/login';
      } else {
        UserService.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;