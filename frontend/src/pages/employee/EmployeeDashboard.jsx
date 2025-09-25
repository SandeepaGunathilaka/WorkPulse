import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Calendar, TrendingUp, Award, CheckCircle, Users, Target, Star, Activity, Bell, Gift, AlertCircle } from 'lucide-react';
import { getUpcomingSchedules, formatScheduleForDisplay } from '../../services/scheduleService';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);

  const stats = [
    {
      title: 'Today\'s Status',
      value: 'Present',
      icon: Clock,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'This Month',
      value: '22 Days',
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Leave Balance',
      value: '15 Days',
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Performance',
      value: 'Excellent',
      icon: Award,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  // Fetch upcoming schedules from backend
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoadingSchedules(true);
      setScheduleError(null);

      try {
        const result = await getUpcomingSchedules(7); // Get next 7 days

        if (result.success) {
          setSchedules(result.data || []);
        } else {
          setScheduleError(result.message || 'Failed to load schedules');
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setScheduleError('Failed to load schedules');
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, []);

  // Quick action handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'clock':
        navigate('/employee/attendance');
        break;
      case 'leave':
        navigate('/employee/leaves/apply');
        break;
      case 'schedule':
        navigate('/employee/schedule');
        break;
      case 'profile':
        navigate('/employee/profile');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      {/* Welcome Hero Section */}
      <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.firstName || 'Employee'}! 👋</h1>
              <p className="text-blue-100 text-lg">Ready to make today amazing? Here's your overview</p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Current Time: {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Star className="w-16 h-16 text-yellow-300" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${stat.color} transition-all duration-500`} style={{width: '75%'}}></div>
                </div>
              </div>
              <div className={`${stat.bgColor} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-8 h-8 ${stat.color} text-white`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { name: 'Clock In/Out', icon: Clock, color: 'bg-green-500', bgColor: 'bg-green-50', action: 'clock' },
          { name: 'Apply Leave', icon: Calendar, color: 'bg-blue-500', bgColor: 'bg-blue-50', action: 'leave' },
          { name: 'View Schedule', icon: Activity, color: 'bg-purple-500', bgColor: 'bg-purple-50', action: 'schedule' },
          { name: 'My Profile', icon: Users, color: 'bg-orange-500', bgColor: 'bg-orange-50', action: 'profile' }
        ].map((actionItem, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(actionItem.action)}
            className={`${actionItem.bgColor} hover:${actionItem.color} hover:text-white p-4 rounded-xl transition-all duration-300 group border border-gray-100 hover:border-transparent hover:shadow-lg transform hover:scale-105 active:scale-95`}
          >
            <actionItem.icon className={`w-6 h-6 ${actionItem.color} mx-auto mb-2 group-hover:text-white transition-colors`} />
            <p className="text-sm font-semibold text-gray-700 group-hover:text-white transition-colors">{actionItem.name}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Recent Activities
            </h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { icon: CheckCircle, title: 'Checked In', time: 'Today at 9:00 AM', color: 'text-green-500', bgColor: 'bg-green-50' },
              { icon: Bell, title: 'Leave Request Approved', time: 'Dec 25-26, 2024', color: 'text-blue-500', bgColor: 'bg-blue-50' },
              { icon: Calendar, title: 'Schedule Updated', time: 'Next week shift: Morning', color: 'text-purple-500', bgColor: 'bg-purple-50' },
              { icon: Gift, title: 'Performance Bonus', time: 'Monthly recognition', color: 'text-orange-500', bgColor: 'bg-orange-50' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`${activity.bgColor} p-3 rounded-xl`}>
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.time}</p>
                </div>
                <Target className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            Upcoming Schedule
            {loadingSchedules && (
              <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
            )}
          </h2>

          <div className="space-y-4">
            {/* Loading State */}
            {loadingSchedules && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your schedule...</p>
              </div>
            )}

            {/* Error State */}
            {scheduleError && !loadingSchedules && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-2">Failed to load schedule</p>
                <p className="text-sm text-gray-500">{scheduleError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* No Schedules */}
            {!loadingSchedules && !scheduleError && schedules.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No upcoming schedules</p>
                <p className="text-sm text-gray-500">Your schedule for the next 7 days is empty</p>
              </div>
            )}

            {/* Schedule List */}
            {!loadingSchedules && !scheduleError && schedules.length > 0 &&
              schedules.map((schedule, index) => {
                const formattedSchedule = formatScheduleForDisplay(schedule);
                return (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{formattedSchedule.date}</p>
                        <p className="text-sm text-gray-600">{formattedSchedule.shift}</p>
                        {formattedSchedule.department && (
                          <p className="text-xs text-gray-500 mt-1">📍 {formattedSchedule.department}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${formattedSchedule.statusColor}`}>
                          {formattedSchedule.status}
                        </span>
                        {formattedSchedule.isSwapRequest && (
                          <div className="mt-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Swap Request
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 font-mono">{formattedSchedule.time}</p>
                    {formattedSchedule.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">💭 {formattedSchedule.notes}</p>
                    )}
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>

      {/* Achievement Section */}
      <div className="mt-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">🎉 Monthly Achievement</h3>
            <p className="text-orange-100">Perfect attendance this month! Keep up the excellent work!</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm font-semibold">Excellence</p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm font-semibold">5 Star Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;