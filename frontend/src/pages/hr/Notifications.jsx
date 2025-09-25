import React, { useState } from 'react';
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  FileText,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Send,
  Plus,
  Eye,
  Trash2
} from 'lucide-react';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Mock data - Replace with actual API calls
  const notifications = [
    {
      id: 1,
      type: 'leave_request',
      title: 'New Leave Request',
      message: 'John Doe has submitted a leave request for 3 days starting from Jan 15, 2024',
      sender: 'System',
      timestamp: '2024-01-10T10:30:00Z',
      isRead: false,
      priority: 'high',
      actionRequired: true,
      relatedEmployee: 'John Doe (EMP001)'
    },
    {
      id: 2,
      type: 'attendance_alert',
      title: 'Late Arrival Alert',
      message: 'Sarah Wilson arrived 30 minutes late today. This is her 3rd late arrival this month.',
      sender: 'Attendance System',
      timestamp: '2024-01-10T09:45:00Z',
      isRead: false,
      priority: 'medium',
      actionRequired: true,
      relatedEmployee: 'Sarah Wilson (EMP002)'
    },
    {
      id: 3,
      type: 'document_expiry',
      title: 'Document Expiry Warning',
      message: 'Medical license for Dr. Mike Johnson will expire in 30 days. Please ensure renewal.',
      sender: 'Document Management',
      timestamp: '2024-01-10T08:15:00Z',
      isRead: true,
      priority: 'high',
      actionRequired: true,
      relatedEmployee: 'Mike Johnson (EMP003)'
    },
    {
      id: 4,
      type: 'system_update',
      title: 'System Maintenance Scheduled',
      message: 'WorkPulse system will undergo maintenance on Jan 15, 2024 from 2:00 AM to 4:00 AM.',
      sender: 'IT Department',
      timestamp: '2024-01-09T16:20:00Z',
      isRead: true,
      priority: 'low',
      actionRequired: false,
      relatedEmployee: null
    },
    {
      id: 5,
      type: 'schedule_conflict',
      title: 'Schedule Conflict Detected',
      message: 'Scheduling conflict detected for Emergency Department on Jan 12, 2024. Manual review required.',
      sender: 'Schedule Management',
      timestamp: '2024-01-09T14:30:00Z',
      isRead: false,
      priority: 'high',
      actionRequired: true,
      relatedEmployee: null
    },
    {
      id: 6,
      type: 'birthday_reminder',
      title: 'Employee Birthday',
      message: 'Emma Davis celebrates her birthday today. Consider sending a greeting.',
      sender: 'HR System',
      timestamp: '2024-01-10T07:00:00Z',
      isRead: true,
      priority: 'low',
      actionRequired: false,
      relatedEmployee: 'Emma Davis (EMP004)'
    }
  ];

  const notificationTypes = {
    leave_request: { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    attendance_alert: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    document_expiry: { icon: FileText, color: 'text-red-600', bgColor: 'bg-red-100' },
    system_update: { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    schedule_conflict: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    birthday_reminder: { icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'unread' && !notification.isRead) ||
                      (activeTab === 'actionRequired' && notification.actionRequired);

    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || notification.type === filterType;

    return matchesTab && matchesSearch && matchesType;
  });

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleMarkAsRead = (notificationIds) => {
    // Implement mark as read logic
    console.log('Marking as read:', notificationIds);
  };

  const handleDeleteNotifications = (notificationIds) => {
    // Implement delete logic
    console.log('Deleting notifications:', notificationIds);
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    actionRequired: notifications.filter(n => n.actionRequired).length,
    high: notifications.filter(n => n.priority === 'high').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-gray-600 mt-2">Manage system notifications and alerts</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowComposeModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Compose
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Unread</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{stats.unread}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Action Required</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{stats.actionRequired}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">High Priority</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{stats.high}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'all', label: 'All Notifications', count: stats.total },
              { id: 'unread', label: 'Unread', count: stats.unread },
              { id: 'actionRequired', label: 'Action Required', count: stats.actionRequired }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="leave_request">Leave Requests</option>
                <option value="attendance_alert">Attendance Alerts</option>
                <option value="document_expiry">Document Expiry</option>
                <option value="system_update">System Updates</option>
                <option value="schedule_conflict">Schedule Conflicts</option>
                <option value="birthday_reminder">Birthday Reminders</option>
              </select>
            </div>

            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMarkAsRead(selectedNotifications)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleDeleteNotifications(selectedNotifications)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'all' && 'All Notifications'}
              {activeTab === 'unread' && 'Unread Notifications'}
              {activeTab === 'actionRequired' && 'Action Required'}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const TypeIcon = notificationTypes[notification.type]?.icon || Bell;
              return (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />

                    <div className={`p-2 rounded-lg ${notificationTypes[notification.type]?.bgColor || 'bg-gray-100'}`}>
                      <TypeIcon className={`w-5 h-5 ${notificationTypes[notification.type]?.color || 'text-gray-600'}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm text-gray-500">
                              From: {notification.sender}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.relatedEmployee && (
                              <span className="text-sm text-blue-600">
                                {notification.relatedEmployee}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority.toUpperCase()}
                          </span>
                          {notification.actionRequired && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              Action Required
                            </span>
                          )}
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
              <p className="text-gray-600">No notifications match your current filters.</p>
            </div>
          )}
        </div>

        {/* Compose Modal */}
        {showComposeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Compose Notification</h3>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>All Employees</option>
                      <option>Department Heads</option>
                      <option>HR Team</option>
                      <option>Specific Department</option>
                      <option>Individual Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="Notification title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={6}
                      placeholder="Type your message here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="actionRequired"
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="actionRequired" className="ml-2 text-sm text-gray-700">
                      Requires action from recipients
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowComposeModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;