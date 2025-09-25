import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  Settings,
  BarChart3,
  Clock,
  UserCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin, isHR, isManager, isEmployee } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect based on role
    if (isAdmin) {
      navigate('/admin');
    } else if (isHR || isManager) {
      navigate('/hr');
    } else if (isEmployee) {
      navigate('/employee');
    }
  }, [user, navigate, isAdmin, isHR, isManager, isEmployee]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getWelcomeMessage()}, {user?.name || 'User'}
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to WorkPulse Hospital Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">Present</p>
              </div>
              <UserCheck className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Work Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">8.5 hrs</p>
              </div>
              <Clock className="w-10 h-10 text-primary-500" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Leave Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">15 days</p>
              </div>
              <Calendar className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Department</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{user?.department || 'N/A'}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/employee/attendance')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <UserCheck className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
                  <p className="text-sm text-gray-600">Check in/out for today</p>
                </button>

                <button
                  onClick={() => navigate('/employee/leave')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <Calendar className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Apply Leave</h3>
                  <p className="text-sm text-gray-600">Request time off</p>
                </button>

                <button
                  onClick={() => navigate('/employee/schedule')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <ClipboardList className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">View Schedule</h3>
                  <p className="text-sm text-gray-600">Check your shifts</p>
                </button>

                <button
                  onClick={() => navigate('/employee/salary')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <DollarSign className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Salary Info</h3>
                  <p className="text-sm text-gray-600">View payslips</p>
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-900">Checked in</p>
                    <p className="text-xs text-gray-600">Today, 9:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-900">Leave request approved</p>
                    <p className="text-xs text-gray-600">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-900">Salary credited</p>
                    <p className="text-xs text-gray-600">5 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;