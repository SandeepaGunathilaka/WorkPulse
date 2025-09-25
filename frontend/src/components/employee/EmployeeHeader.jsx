import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Menu,
  User,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
  Clock,
  Calendar
} from 'lucide-react';

const EmployeeHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/login');
    } catch (error) {
      showToast('Failed to logout', 'error');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Mock notifications - replace with real data
  const notifications = [
    {
      id: 1,
      title: 'Leave Request Approved',
      message: 'Your leave request for Dec 25-26 has been approved',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Schedule Update',
      message: 'Your schedule for next week has been updated',
      time: '1 day ago',
      read: true
    },
    {
      id: 3,
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 2 AM - 4 AM',
      time: '2 days ago',
      read: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Menu and Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo and title */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-18 h-10 p-2 bg-white rounded-lg shadow-md border border-gray-100">
              <img
                src="/Logo.png?v=1"
                alt="WorkPulse Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Employee Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.name}!</p>
            </div>
          </div>
        </div>

        {/* Center - Time and Date */}
        <div className="hidden md:flex items-center gap-6 text-center">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-lg font-mono font-semibold">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">Current Time</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium">
                {formatDate(currentTime)}
              </div>
              <div className="text-xs text-gray-500">Today's Date</div>
            </div>
          </div>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || 'Employee'}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.role || 'Employee'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user?.name || 'Employee'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {user?.employeeId}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/employee/profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate('/employee/settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default EmployeeHeader;