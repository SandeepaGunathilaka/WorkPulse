import api from './api';

const employeeService = {
  // Get all employees with filtering and pagination
  getAllEmployees: async (params = {}) => {
    try {
      const response = await api.get('/employees', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch employees');
    }
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch employee');
    }
  },

  // Create new employee
  createEmployee: async (employeeData) => {
    try {
      const response = await api.post('/employees', employeeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create employee');
    }
  },

  // Update employee
  updateEmployee: async (id, employeeData) => {
    try {
      const response = await api.put(`/employees/${id}`, employeeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update employee');
    }
  },

  // Delete employee
  deleteEmployee: async (id) => {
    try {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete employee');
    }
  },

  // Get employee statistics
  getEmployeeStats: async () => {
    try {
      const response = await api.get('/employees/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch employee statistics');
    }
  },

  // Generate new employee ID
  generateEmployeeId: async () => {
    try {
      const response = await api.get('/employees/generate-id');
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, generate client-side
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 9999) + 1;
      return {
        success: true,
        data: { employeeId: `EMP${year}${randomNum.toString().padStart(4, '0')}` }
      };
    }
  },

  // Set/Reset employee password (Admin only)
  setPassword: async (employeeId, newPassword) => {
    try {
      const response = await api.put(`/employees/${employeeId}/password`, { newPassword });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to set password');
    }
  },

  // Update employee salary and EPF details (HR/Admin only)
  updateSalary: async (employeeId, salaryData) => {
    try {
      const response = await api.put(`/employees/${employeeId}/salary`, salaryData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update salary details');
    }
  }
};

export { employeeService };
export default employeeService;