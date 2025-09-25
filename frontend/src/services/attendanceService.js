import api from './api';

class AttendanceService {
  // Clock in
  async clockIn(data) {
    try {
      const response = await api.post('/attendance/clock-in', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Clock out
  async clockOut(data) {
    try {
      const response = await api.post('/attendance/clock-out', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Start break
  async startBreak(data) {
    try {
      const response = await api.post('/attendance/break-start', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // End break
  async endBreak() {
    try {
      const response = await api.post('/attendance/break-end');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get today's attendance
  async getTodayAttendance() {
    try {
      const response = await api.get('/attendance/today');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get my attendance records
  async getMyAttendance(params = {}) {
    try {
      const response = await api.get('/attendance/my-records', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get attendance statistics (Employee - only own data)
  async getAttendanceStats(params = {}) {
    try {
      const response = await api.get('/attendance/my-stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get all attendance statistics (Admin/HR only)
  async getAllAttendanceStats(params = {}) {
    try {
      const response = await api.get('/attendance/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get all attendance (Admin/HR)
  async getAllAttendance(params = {}) {
    try {
      const response = await api.get('/attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new AttendanceService();