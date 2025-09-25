import api from './api';

class LeaveService {
  // Apply for leave
  async applyLeave(data) {
    try {
      const response = await api.post('/leaves', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get my leave requests
  async getMyLeaves(params = {}) {
    try {
      const response = await api.get('/leaves/my-leaves', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get leave balance
  async getLeaveBalance() {
    try {
      const response = await api.get('/leaves/balance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update leave request
  async updateLeave(id, data) {
    try {
      const response = await api.put(`/leaves/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Cancel leave request
  async cancelLeave(id) {
    try {
      const response = await api.delete(`/leaves/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Admin/HR functions

  // Get all leave requests (Admin/HR)
  async getAllLeaves(params = {}) {
    try {
      const response = await api.get('/leaves', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Approve leave request (Admin/HR)
  async approveLeave(id, remarks = '') {
    try {
      const response = await api.put(`/leaves/${id}/approve`, { remarks });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Reject leave request (Admin/HR)
  async rejectLeave(id, remarks = '') {
    try {
      const response = await api.put(`/leaves/${id}/reject`, { remarks });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get leave statistics (Admin/HR)
  async getLeaveStats(params = {}) {
    try {
      const response = await api.get('/leaves/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Admin leave balance management

  // Get all employee leave balances (Admin/HR)
  async getAllLeaveBalances(params = {}) {
    try {
      const response = await api.get('/leaves/admin/balances', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update employee leave balance (Admin/HR)
  async updateLeaveBalance(employeeId, data) {
    try {
      const response = await api.put(`/leaves/admin/balances/${employeeId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Leave policy management

  // Get leave policies (Admin)
  async getLeavePolicies(params = {}) {
    try {
      const response = await api.get('/leaves/admin/policies', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create/Update leave policy (Admin)
  async createLeavePolicy(data) {
    try {
      const response = await api.post('/leaves/admin/policies', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new LeaveService();