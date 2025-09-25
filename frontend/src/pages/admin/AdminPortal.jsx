import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import {
  Users, Settings, Shield, Database, Activity, AlertTriangle,
  TrendingUp, Calendar, DollarSign, Clock, CheckCircle,
  XCircle, Award, Building2, BarChart3, Target
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminSidebar from '../../components/admin/AdminSidebar';
import UserManagement from './UserManagement';
import AdminEmployeeManagement from './EmployeeManagement';
import LeavePoliciesPage from './LeavePoliciesPage';
import LeaveManagement from './LeaveManagement';
import LeaveBalancePage from './LeaveBalancePage';
import ShiftManagement from './ShiftManagement';
import SalaryPage from './SalaryPageNew';
import dashboardService from '../../services/dashboardService';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    adminStats: { data: {} },
    employeeStats: { data: {} },
    leaveStats: { data: {} },
    salaryStats: { data: {} },
    recentActivities: { data: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const { adminStats, employeeStats, leaveStats, salaryStats, recentActivities } = dashboardData;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Welcome back! Here's what's happening at your hospital today.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{adminStats?.data?.totalUsers || 0}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {adminStats?.data?.activeUsers || 0} active
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Leave Requests</p>
              <p className="text-3xl font-bold text-gray-900">{leaveStats?.data?.totalRequests || 0}</p>
              <p className="text-xs text-orange-600 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {leaveStats?.data?.pendingRequests || 0} pending
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Monthly Payroll</p>
              <p className="text-3xl font-bold text-gray-900">
                LKR {(salaryStats?.data?.totalPayroll || 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                {salaryStats?.data?.approvedSalaries || 0} approved
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">System Health</p>
              <p className="text-3xl font-bold text-green-600">99.8%</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <Activity className="w-3 h-3 mr-1" />
                All systems operational
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Department Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Department Distribution
          </h3>
          <div className="space-y-4">
            {adminStats?.data?.departmentDistribution?.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {dept._id || 'Unassigned'}
                </span>
                <span className="text-lg font-bold text-blue-600">{dept.count}</span>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-8">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No department data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-600" />
            Role Distribution
          </h3>
          <div className="space-y-4">
            {adminStats?.data?.roleDistribution?.map((role, index) => {
              const roleColors = {
                admin: 'text-red-600 bg-red-50',
                hr: 'text-blue-600 bg-blue-50',
                manager: 'text-green-600 bg-green-50',
                employee: 'text-gray-600 bg-gray-50'
              };
              const colorClass = roleColors[role._id] || 'text-gray-600 bg-gray-50';

              return (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${colorClass}`}>
                  <span className="text-sm font-medium capitalize">
                    {role._id}
                  </span>
                  <span className="text-lg font-bold">{role.count}</span>
                </div>
              );
            }) || (
              <div className="text-center text-gray-500 py-8">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No role data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group">
              <Users className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Manage Users</span>
            </button>
            <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all group">
              <Calendar className="w-5 h-5 text-gray-600 group-hover:text-green-600 mr-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Review Leaves</span>
            </button>
            <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all group">
              <DollarSign className="w-5 h-5 text-gray-600 group-hover:text-purple-600 mr-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Process Salaries</span>
            </button>
            <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all group">
              <Settings className="w-5 h-5 text-gray-600 group-hover:text-orange-600 mr-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">System Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Recent System Activities
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivities?.data?.length > 0 ? recentActivities.data.map((activity, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.performedBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Success
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent activities to display</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminPortal = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Debug: Log the current location
  React.useEffect(() => {
    console.log('🔍 AdminPortal - Location object:', location);
    console.log('🔍 AdminPortal - Pathname:', location.pathname);
  }, [location]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex-1 flex flex-col lg:ml-[280px]">
        {/* Header */}
        <AdminHeader
          onMenuToggle={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Main content */}
        <main className="flex-1">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="employees" element={<AdminEmployeeManagement />} />
            <Route path="schedules" element={<ShiftManagement />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="leaves/policies" element={<LeavePoliciesPage />} />
            <Route path="leaves/balance" element={<LeaveBalancePage />} />
            <Route path="leaves" element={<LeaveManagement />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminPortal;