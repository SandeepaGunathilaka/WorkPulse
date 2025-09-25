import api from './api';

class UserService {
  // Get all users
  async getAllUsers(params = {}) {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      const response = await api.get(`/users/role/${role}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update user
  async updateUser(id, data) {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get employee stats
  async getEmployeeStats() {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get total staff count
  async getTotalStaffCount() {
    try {
      const response = await api.get('/users/count/staff');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new UserService();