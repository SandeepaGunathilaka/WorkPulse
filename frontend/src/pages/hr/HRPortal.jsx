import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Users, Calendar, ClipboardList, BarChart3, DollarSign,
  TrendingUp, Clock, Award, Activity, Briefcase, PieChart,
  UserCheck, UserX, FileText, AlertCircle
} from 'lucide-react';
import EmployeeManagement from './EmployeeManagement';
import AddEmployee from './AddEmployee';
import SalaryManagement from '../admin/SalaryManagement';
import SalaryRecords from './SalaryRecords';
import SalaryReports from './SalaryReports';
import AttendanceManagement from './AttendanceManagement';
import AttendanceRecords from './AttendanceRecords';
import LeaveRequests from './LeaveRequests';
import LeaveBalance from './LeaveBalance';
import EmployeeReports from './EmployeeReports';
import Notifications from './Notifications';
import HRSidebar from '../../components/hr/HRSidebar';
import HRHeader from '../../components/hr/HRHeader';
import ApiStatus from '../../components/common/ApiStatus';
import { employeeService } from '../../services/employeeService';
import { useToast } from '../../contexts/ToastContext';

const HRDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveToday: 0,
    pendingRequests: 0,
    attendanceRate: 0,
    newHires: 0,
    departmentDistribution: [],
    recentActivities: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch employee data
      const employeesRes = await employeeService.getAllEmployees({ limit: 1000 });
      const employees = employeesRes.data || [];

      // Calculate dashboard metrics
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(emp => {
        const status = emp.status || emp.employmentStatus || 'active';
        return status.toLowerCase() === 'active';
      }).length;

      // Calculate department distribution
      const deptData = {};
      employees.forEach(emp => {
        const dept = emp.department || emp.workInfo?.department || 'Other';
        if (!deptData[dept]) {
          deptData[dept] = { name: dept, count: 0, percentage: 0 };
        }
        deptData[dept].count++;
      });

      const departmentDistribution = Object.values(deptData).map(dept => ({
        ...dept,
        percentage: ((dept.count / totalEmployees) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count).slice(0, 5);

      // Calculate new hires this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newHires = employees.filter(emp => {
        const joinDate = emp.dateOfJoining || emp.joinDate || emp.createdAt;
        if (joinDate) {
          const date = new Date(joinDate);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }
        return false;
      }).length;

      setDashboardData({
        totalEmployees,
        activeEmployees,
        onLeaveToday: Math.floor(Math.random() * 15) + 5, // Mock data
        pendingRequests: Math.floor(Math.random() * 20) + 10, // Mock data
        attendanceRate: 94.5 + (Math.random() * 3), // Mock data
        newHires,
        departmentDistribution,
        recentActivities: [
          { type: 'hire', message: 'New employee onboarded', department: 'Cardiology', time: '2 hours ago' },
          { type: 'leave', message: 'Leave request approved', employee: 'Sarah Wilson', time: '5 hours ago' },
          { type: 'attendance', message: 'Attendance report generated', month: 'December', time: '1 day ago' },
          { type: 'salary', message: 'Salary processed', count: 156, time: '2 days ago' }
        ]
      });
    } catch (error) {
      showError('Failed to fetch dashboard data');
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Professional Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-dashboard" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e40af" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dashboard)" />
          </svg>
        </div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
      `}</style>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">HR Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your workforce overview</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 font-medium">Live Data</span>
              </div>
              
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-700 font-semibold">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Professional Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Total Employees Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Employees</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.totalEmployees}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      All departments
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors duration-300">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Active Employees Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Active</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.activeEmployees}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Currently working
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl group-hover:bg-emerald-100 transition-colors duration-300">
                    <UserCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* On Leave Today Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">On Leave</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.onLeaveToday}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Today
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl group-hover:bg-amber-100 transition-colors duration-300">
                    <Calendar className="w-8 h-8 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* Pending Requests Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Pending</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.pendingRequests}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Requests
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl group-hover:bg-orange-100 transition-colors duration-300">
                    <ClipboardList className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Attendance Rate Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Attendance</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {dashboardData.attendanceRate.toFixed(1)}%
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      This month
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl group-hover:bg-purple-100 transition-colors duration-300">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>


            {/* Charts and Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Department Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-600 p-3 rounded-xl mr-4 shadow-md">
                    <PieChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Department Distribution</h3>
                    <p className="text-gray-600 text-sm">Top 5 departments</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {dashboardData.departmentDistribution.map((dept, index) => (
                    <div key={dept.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-emerald-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-amber-500' : 'bg-pink-500'
                        }`}></div>
                        <span className="text-sm font-semibold text-gray-700">{dept.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{dept.count}</div>
                        <div className="text-xs text-gray-500">{dept.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-600 p-3 rounded-xl mr-4 shadow-md">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                    <p className="text-gray-600 text-sm">Common HR tasks</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/hr/employees/add')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-gray-700 group-hover:text-blue-700 font-medium">Add New Employee</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => navigate('/hr/leave/requests')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-300 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 group-hover:text-green-700 font-medium">Review Leave Requests</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => navigate('/hr/reports/employees')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:border-purple-300 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-gray-700 group-hover:text-purple-700 font-medium">Generate Reports</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => navigate('/hr/salary/generate')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 hover:border-amber-300 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-amber-200 transition-colors">
                        <DollarSign className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-gray-700 group-hover:text-amber-700 font-medium">Salary Management</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-emerald-600 p-3 rounded-xl mr-4 shadow-md">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Recent Activities</h3>
                    <p className="text-gray-600 text-sm">Latest HR actions</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {dashboardData.recentActivities.map((activity, index) => {
                    const getActivityColor = (type) => {
                      switch(type) {
                        case 'hire': return 'bg-green-500';
                        case 'leave': return 'bg-blue-500';
                        case 'attendance': return 'bg-orange-500';
                        case 'salary': return 'bg-purple-500';
                        default: return 'bg-gray-500';
                      }
                    };
                    const getActivityIcon = (type) => {
                      switch(type) {
                        case 'hire': return UserCheck;
                        case 'leave': return Calendar;
                        case 'attendance': return Clock;
                        case 'salary': return DollarSign;
                        default: return Activity;
                      }
                    };
                    const Icon = getActivityIcon(activity.type);

                    return (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-3 h-3 ${getActivityColor(activity.type)} rounded-full mt-2 flex-shrink-0`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-900 font-semibold">{activity.message}</p>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{activity.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.department || activity.employee || activity.month || `${activity.count} employees` || ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors">
                    View All Activities
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const HRPortal = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <HRSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <HRHeader onMenuToggle={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HRDashboard />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/employees/add" element={<AddEmployee />} />
            <Route path="/attendance/view" element={<AttendanceManagement />} />
            <Route path="/attendance/records" element={<AttendanceRecords />} />
            <Route path="/leave/requests" element={<LeaveRequests />} />
            <Route path="/leave/balance" element={<LeaveBalance />} />
            <Route path="/salary/generate" element={<SalaryManagement />} />
            <Route path="/salary/records" element={<SalaryRecords />} />
            <Route path="/salary/reports" element={<SalaryReports />} />
            <Route path="/salary/*" element={<SalaryManagement />} />
            <Route path="/reports/employees" element={<EmployeeReports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/*" element={<HRDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default HRPortal;