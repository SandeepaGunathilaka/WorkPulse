import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors - but be more careful
    if (error.response?.status === 401) {
      // Only logout if it's not a login/register attempt and not a profile validation
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/auth/register');
      const isProfileRequest = error.config?.url?.includes('/auth/profile');

      // Don't auto-logout on profile validation failures during app initialization
      if (!isLoginRequest && !isRegisterRequest && !isProfileRequest) {
        console.warn('Authentication failed for non-auth request - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else if (isProfileRequest) {
        console.warn('Profile validation failed, but not auto-logging out');
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      throw new Error('Network connection failed. Please check your internet connection.');
    }

    return Promise.reject(error);
  }
);

export default api;