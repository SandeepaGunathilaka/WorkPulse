import api from './api';

const leavePolicyService = {
  // Get all leave policies
  getAllPolicies: async () => {
    try {
      console.log('🌐 Making API call to get policies...');
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const userRole = user ? JSON.parse(user).role : null;
      console.log('🔑 Token exists:', !!token);
      console.log('👤 User exists:', !!user);
      console.log('🎯 User role:', userRole);

      // Use different endpoints based on user role
      const endpoint = userRole === 'employee' ? '/leaves/policies' : '/leaves/admin/policies';
      console.log('📍 Using endpoint:', endpoint);

      const response = await api.get(endpoint);
      console.log('📡 Raw API response:', response.data);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Failed to get leave policies:', error);
      console.error('🔍 Error details:', error.response?.data);
      console.error('🔍 Status:', error.response?.status);

      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch leave policies'
      };
    }
  },

  // Create a new leave policy
  createPolicy: async (policyData) => {
    try {
      const response = await api.post('/leaves/admin/policies', policyData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to create leave policy:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create leave policy'
      };
    }
  },

  // Update a leave policy
  updatePolicy: async (policyId, policyData) => {
    try {
      const response = await api.put(`/leaves/admin/policies/${policyId}`, policyData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to update leave policy:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update leave policy'
      };
    }
  },

  // Delete a leave policy
  deletePolicy: async (policyId) => {
    try {
      const response = await api.delete(`/leaves/admin/policies/${policyId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to delete leave policy:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete leave policy'
      };
    }
  }
};

export default leavePolicyService;