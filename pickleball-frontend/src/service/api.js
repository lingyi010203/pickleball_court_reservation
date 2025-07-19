import axios from 'axios';
import UserService from './UserService';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = UserService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      UserService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;