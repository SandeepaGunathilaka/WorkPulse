import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user state immediately from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
    return null;
  });
  const [loading, setLoading] = useState(false); // Set to false by default
  const [error, setError] = useState(null);

  // Set axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Set authorization header if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Function to restore auth state from localStorage
  const restoreAuthState = () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Restoring auth state:', parsedUser);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    return false;
  };

  // Simple initialization - just handle target path redirect if exists
  useEffect(() => {
    const targetPath = sessionStorage.getItem('targetPath');
    if (targetPath && user) {
      console.log('Redirecting to target path:', targetPath);
      sessionStorage.removeItem('targetPath');
      setTimeout(() => {
        window.location.href = targetPath;
      }, 100);
    }
  }, [user]);

  // Create a function to update auth state directly (for mock login)
  const refreshAuthState = () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔄 Refreshing auth state:', parsedUser);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      setUser(null);
    }
  };

  // Listen for localStorage changes (for mock login)
  useEffect(() => {
    const handleCustomStorageChange = () => {
      console.log('Custom storage event detected');
      refreshAuthState();
    };

    window.addEventListener('localStorage-changed', handleCustomStorageChange);

    return () => {
      window.removeEventListener('localStorage-changed', handleCustomStorageChange);
    };
  }, []);

  const validateToken = async () => {
    try {
      // Try to call a protected endpoint to validate token
      const response = await axios.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      // Don't logout immediately, let the API interceptor handle it
    }
  };

  const login = async (email, password, mockResponse = null) => {
    try {
      setError(null);

      let token, user;

      // Handle mock login response
      if (mockResponse) {
        token = mockResponse.token;
        user = mockResponse.user;
        console.log('🎭 Using mock login response');
      } else {
        // Regular API login
        console.log('🔑 Sending login request:', { email, password: '***' + password.slice(-3) });
        const response = await axios.post('/auth/login', { email, password });
        token = response.data.token;
        user = response.data.user;
      }

      // Store both token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      console.log('✅ Login successful, user set:', user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;

      // Store both token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/auth/updatepassword', {
        currentPassword,
        newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update password' };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updatePassword,
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin: user?.role === 'admin',
    isHR: user?.role === 'hr',
    isManager: user?.role === 'manager',
    isEmployee: user?.role === 'employee'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};