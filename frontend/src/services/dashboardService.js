import api from './api';

export const dashboardService = {
  // Get admin dashboard statistics
  getAdminStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get recent activities/audit logs
  getRecentActivities: async () => {
    const response = await api.get('/admin/logs');
    return response.data;
  },

  // Get employee count by department
  getEmployeeStats: async () => {
    const response = await api.get('/employees/stats');
    return response.data;
  },

  // Get leave statistics
  getLeaveStats: async () => {
    const response = await api.get('/leaves/stats');
    return response.data;
  },

  // Get attendance statistics
  getAttendanceStats: async () => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },

  // Get salary statistics
  getSalaryStats: async () => {
    const response = await api.get('/salary/stats');
    return response.data;
  },

  // Get comprehensive dashboard data
  getDashboardData: async () => {
    try {
      const [
        adminStats,
        recentActivities,
        employeeStats,
        leaveStats,
        attendanceStats,
        salaryStats
      ] = await Promise.allSettled([
        dashboardService.getAdminStats(),
        dashboardService.getRecentActivities(),
        dashboardService.getEmployeeStats().catch(() => ({ data: {} })),
        dashboardService.getLeaveStats().catch(() => ({ data: {} })),
        dashboardService.getAttendanceStats().catch(() => ({ data: {} })),
        dashboardService.getSalaryStats().catch(() => ({ data: {} }))
      ]);

      return {
        adminStats: adminStats.status === 'fulfilled' ? adminStats.value : { data: {} },
        recentActivities: recentActivities.status === 'fulfilled' ? recentActivities.value : { data: [] },
        employeeStats: employeeStats.status === 'fulfilled' ? employeeStats.value : { data: {} },
        leaveStats: leaveStats.status === 'fulfilled' ? leaveStats.value : { data: {} },
        attendanceStats: attendanceStats.status === 'fulfilled' ? attendanceStats.value : { data: {} },
        salaryStats: salaryStats.status === 'fulfilled' ? salaryStats.value : { data: {} }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardService;