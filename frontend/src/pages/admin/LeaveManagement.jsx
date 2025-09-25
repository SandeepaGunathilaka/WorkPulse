import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, Clock, CheckCircle, XCircle, Filter, Search, Download,
  Eye, BarChart3, TrendingUp, AlertCircle, FileText, Activity, ArrowUp,
  ArrowDown, Award, Briefcase, Heart, Shield, Star, UserCheck, TrendingDown,
  ChevronRight, Settings, PieChart, Layers, Zap, Target, BookOpen, Coffee,
  Sun, Moon, Cloud, Smile, Frown, Meh, ThumbsUp, MessageSquare, Send
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import leaveService from '../../services/leaveService';
// import userService from '../../services/userService';
import api from '../../services/api';
import { format } from 'date-fns';

const UltraBeautifulLeaveManagement = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [totalStaff, setTotalStaff] = useState(0);

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', icon: '🏥', color: 'from-red-400 to-rose-600', bgColor: 'bg-gradient-to-br from-red-50 to-rose-100' },
    { value: 'annual', label: 'Annual Leave', icon: '🏖️', color: 'from-blue-400 to-indigo-600', bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100' },
    { value: 'casual', label: 'Casual Leave', icon: '😊', color: 'from-purple-400 to-violet-600', bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100' },
    { value: 'personal', label: 'Personal Leave', icon: '👤', color: 'from-purple-400 to-violet-600', bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100' },
    { value: 'emergency', label: 'Emergency', icon: '🚨', color: 'from-orange-400 to-amber-600', bgColor: 'bg-gradient-to-br from-orange-50 to-amber-100' },
    { value: 'maternity', label: 'Maternity', icon: '👶', color: 'from-pink-400 to-fuchsia-600', bgColor: 'bg-gradient-to-br from-pink-50 to-fuchsia-100' },
    { value: 'paternity', label: 'Paternity', icon: '👨‍👶', color: 'from-green-400 to-emerald-600', bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100' }
  ];

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveStats();
    fetchTotalStaff();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getAllLeaves();
      if (response && response.data) {
        // Transform backend data to match frontend format
        const transformedData = response.data.map(leave => ({
          ...leave,
          employee: {
            ...leave.employee,
            avatar: leave.employee?.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️',
            position: leave.employee?.position || 'Staff',
            employeeId: leave.employee?.employeeId || leave.employee?._id
          }
        }));
        setLeaveRequests(transformedData);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      showError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalStaff = async () => {
    try {
      const response = await api.get('/staff/count');
      if (response && response.data && typeof response.data.count === 'number') {
        setTotalStaff(response.data.count);
      } else {
        // If the new endpoint doesn't work, use a reasonable default
        setTotalStaff(0);
      }
    } catch (error) {
      console.error('Error fetching total staff:', error);
      // If error, use a reasonable fallback
      setTotalStaff(0);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      console.log('🔥🔥🔥 FRONTEND: Calling leave stats API...');
      const response = await leaveService.getLeaveStats();
      console.log('🔥🔥🔥 FRONTEND: Leave stats response:', response);
      if (response && response.data) {
        setLeaveStats(response.data);
      } else {
        // Fallback stats if API doesn't return data
        setLeaveStats({
          overall: {
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            rejectedRequests: 0,
            totalDaysRequested: 0,
            averageLeaveLength: 0
          },
          trends: {
            monthlyIncrease: 0,
            approvalRate: 0,
            averageProcessingTime: 0
          }
        });
      }
    } catch (error) {
      console.error('🔥🔥🔥 FRONTEND: Error fetching leave stats:', error);
      console.error('🔥🔥🔥 FRONTEND: Error details:', error.response?.data || error.message);
      // Set default stats on error
      setLeaveStats({
        overall: {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          totalDaysRequested: 0,
          averageLeaveLength: 0
        },
        trends: {
          monthlyIncrease: 0,
          approvalRate: 0,
          averageProcessingTime: 0
        }
      });
    }
  };

  const handleApprove = async (leaveId, remarks = '') => {
    try {
      await leaveService.approveLeave(leaveId, remarks);
      showSuccess('Leave request approved successfully! ✨🎉');
      fetchLeaveRequests();
      fetchLeaveStats();
    } catch (error) {
      console.error('Error approving leave:', error);
      showError(error.message || 'Failed to approve leave request');
    }
  };

  const handleReject = async (leaveId, remarks = '') => {
    try {
      await leaveService.rejectLeave(leaveId, remarks);
      showSuccess('Leave request rejected');
      fetchLeaveRequests();
      fetchLeaveStats();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      showError(error.message || 'Failed to reject leave request');
    }
  };

  const handleViewDetails = (leave) => {
    setSelectedRequest(leave);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Quick Actions Handlers
  const handleReviewPending = () => {
    setActiveTab('pending');
    showSuccess('🔍 Switched to Pending Requests tab');
  };

  const handleTodaysLeaves = () => {
    const todaysLeaves = leaveRequests.filter(l =>
      l.status === 'approved' &&
      new Date(l.startDate) <= new Date() &&
      new Date(l.endDate) >= new Date()
    );

    if (todaysLeaves.length > 0) {
      setActiveTab('approved');
      showSuccess(`📅 Found ${todaysLeaves.length} employee(s) on leave today`);
    } else {
      showSuccess('📅 No employees on leave today');
    }
  };

  const handleExportReport = async () => {
    try {
      showSuccess('📊 Generating leave report...');

      // Create CSV content
      const headers = ['Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied Date', 'Reason'];
      const csvContent = [
        headers.join(','),
        ...leaveRequests.map(leave => [
          `"${(leave.employee?.firstName || '') + ' ' + (leave.employee?.lastName || '')}"`,
          `"${leave.employee?.department || leave.department || 'General'}"`,
          `"${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}"`,
          `"${leave.startDate ? format(new Date(leave.startDate), 'yyyy-MM-dd') : 'N/A'}"`,
          `"${leave.endDate ? format(new Date(leave.endDate), 'yyyy-MM-dd') : 'N/A'}"`,
          leave.totalDays || 0,
          `"${leave.status}"`,
          `"${leave.appliedDate ? format(new Date(leave.appliedDate), 'yyyy-MM-dd') : 'N/A'}"`,
          `"${leave.reason || 'No reason provided'}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('✅ Leave report downloaded successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      showError('❌ Failed to export report');
    }
  };

  const handleManagePolicies = () => {
    showSuccess('⚙️ Policy management feature coming soon! This will allow you to configure leave policies, balance rules, and approval workflows.');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        text: 'text-white',
        icon: Clock,
        label: 'Pending',
        animation: 'animate-pulse'
      },
      approved: {
        bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
        text: 'text-white',
        icon: CheckCircle,
        label: 'Approved',
        animation: ''
      },
      rejected: {
        bg: 'bg-gradient-to-r from-red-400 to-rose-500',
        text: 'text-white',
        icon: XCircle,
        label: 'Rejected',
        animation: ''
      }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-full ${config.bg} ${config.text} ${config.animation} shadow-lg`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </span>
    );
  };

  const LeaveRequestsList = ({ requests, title, emptyMessage, headerColor = "from-blue-600 to-indigo-700", onViewDetails }) => (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
      <div className={`bg-gradient-to-r ${headerColor} p-8 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <Users className="w-40 h-40 animate-pulse" />
        </div>
        <div className="relative z-10 flex items-center justify-between text-white">
          <div>
            <h3 className="text-3xl font-bold flex items-center mb-3">
              <div className="relative mr-4">
                <Calendar className="w-10 h-10" />
                <div className="absolute inset-0 w-10 h-10 bg-white rounded-lg opacity-20 animate-ping"></div>
              </div>
              {title}
              <span className="ml-3 text-2xl animate-bounce">📋</span>
            </h3>
            <p className="text-purple-100 text-lg">Real-time overview of employee leave applications</p>
            <div className="mt-4 flex space-x-4 text-sm">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="opacity-80">Total Requests:</span>
                <span className="font-bold ml-1">{requests.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-300 opacity-30"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Loading Beautiful Data</h3>
          <p className="text-gray-500">Fetching the latest leave requests with style...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-16 text-center">
          <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{emptyMessage}</h3>
          <p className="text-gray-500">There are no leave requests to display at the moment.</p>
        </div>
      ) : (
        <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="grid gap-6">
            {requests
              .sort((a, b) => new Date(b.appliedDate || b.createdAt) - new Date(a.appliedDate || a.createdAt))
              .map((leave) => (
              <div
                key={leave._id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-xl text-white shadow-md">
                        {leave.employee?.avatar || (leave.employee?.firstName ? leave.employee.firstName[0].toUpperCase() : 'U')}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-lg font-bold text-gray-900">
                          {leave.employee?.firstName || leave.employee?.name || 'Employee'} {leave.employee?.lastName || ''}
                        </h4>
                        {getStatusBadge(leave.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1 text-blue-500" />
                          {leave.employee?.position || 'Staff'}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-green-500" />
                          {leave.employee?.department || leave.department || 'General'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-purple-500" />
                          {leave.totalDays} days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {leave.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(leave._id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                          title="Approve Request"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(leave._id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                          title="Reject Request"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Reject</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onViewDetails && onViewDetails(leave)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Details</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">Leave Type</span>
                      <p className="font-semibold text-gray-800 flex items-center mt-1">
                        <span className="text-lg mr-2">{leaveTypes.find(t => t.value === leave.type)?.icon}</span>
                        {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Duration</span>
                      <p className="font-semibold text-gray-800 mt-1">
                        {leave.startDate ? format(new Date(leave.startDate), 'MMM dd') : 'N/A'} - {leave.endDate ? format(new Date(leave.endDate), 'MMM dd') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Applied</span>
                      <p className="font-semibold text-gray-800 mt-1">
                        {leave.appliedDate ? format(new Date(leave.appliedDate), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium text-sm">Reason</span>
                    <p className="text-gray-700 mt-1 text-sm">
                      {leave.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-8">
      {/* Professional Dashboard Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center">
                <Activity className="w-8 h-8 mr-3" />
                Dashboard Overview
              </h2>
              <p className="text-blue-100 text-lg">Real-time insights and leave management analytics</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Last Updated</p>
              <p className="text-xl font-semibold">{format(new Date(), 'MMM dd, yyyy')}</p>
              <p className="text-blue-100 text-sm">{format(new Date(), 'EEEE, h:mm a')}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 bg-gray-50">
          <div className="p-4 text-center border-r border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Active Staff</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
          </div>
          <div className="p-4 text-center border-r border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-amber-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">On Leave</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{leaveRequests.filter(l => l.status === 'approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length}</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Approved Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{leaveRequests.filter(l => l.status === 'approved' && new Date(l.appliedDate || l.createdAt).toDateString() === new Date().toDateString()).length}</p>
          </div>
        </div>
      </div>

      {/* Spectacular Animated Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            title: 'Today\'s Highlights',
            value: '🌟',
            icon: Star,
            color: 'from-yellow-400 to-orange-500',
            bgPattern: 'from-yellow-50 to-orange-50',
            trend: 'Excellent',
            trendUp: true,
            subtitle: 'System Status'
          },
          {
            title: 'Total Requests',
            value: leaveRequests.length,
            icon: FileText,
            color: 'from-blue-500 to-cyan-600',
            bgPattern: 'from-blue-50 to-cyan-50',
            trend: leaveRequests.length > 0 ? `${leaveRequests.length} total` : '0 total',
            trendUp: true
          },
          {
            title: 'Pending Approval',
            value: leaveRequests.filter(l => l.status === 'pending').length,
            icon: Clock,
            color: 'from-amber-500 to-yellow-600',
            bgPattern: 'from-amber-50 to-yellow-50',
            trend: `${leaveRequests.filter(l => l.status === 'pending').length} requests`,
            pulse: true
          },
          {
            title: 'Approved',
            value: leaveRequests.filter(l => l.status === 'approved').length,
            icon: CheckCircle,
            color: 'from-emerald-500 to-green-600',
            bgPattern: 'from-emerald-50 to-green-50',
            trend: `${Math.round((leaveRequests.filter(l => l.status === 'approved').length / Math.max(leaveRequests.length, 1)) * 100)}%`,
            trendUp: true
          },
          {
            title: 'Rejected',
            value: leaveRequests.filter(l => l.status === 'rejected').length,
            icon: XCircle,
            color: 'from-red-500 to-rose-600',
            bgPattern: 'from-red-50 to-rose-50',
            trend: `${leaveRequests.filter(l => l.status === 'rejected').length} rejected`,
            trendUp: false
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          const isHighlight = stat.title === 'Today\'s Highlights';
          return (
            <div
              key={index}
              className={`relative group bg-gradient-to-br ${stat.bgPattern} rounded-3xl p-6 border border-white shadow-xl hover:shadow-2xl transform hover:-translate-y-3 hover:rotate-1 transition-all duration-500 overflow-hidden ${isHighlight ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''}`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
              {isHighlight && <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 opacity-10 animate-pulse"></div>}

              <div className={`absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity ${stat.pulse ? 'animate-pulse' : ''}`}>
                <Icon className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-2xl mb-4 ${stat.pulse ? 'animate-pulse' : ''} transform group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="text-sm font-bold text-gray-700 mb-2 tracking-wide">{stat.title}</h3>
                {stat.subtitle && <p className="text-xs text-gray-500 mb-3">{stat.subtitle}</p>}
                <div className="flex items-baseline justify-between">
                  <p className={`text-4xl font-black ${isHighlight ? 'text-6xl' : ''} bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <span className={`flex items-center text-sm font-semibold ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trendUp ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                      {stat.trend}
                    </span>
                  )}
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 rounded-full`}></div>
              {hoveredCard === index && (
                <div className="absolute inset-0 bg-white opacity-5 rounded-3xl animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Professional Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-20">
              <PieChart className="w-32 h-32 animate-spin" style={{animationDuration: '20s'}} />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold flex items-center mb-2">
                <PieChart className="w-8 h-8 mr-3 animate-pulse" />
                Leave Analytics Dashboard
                <span className="ml-2 text-xl">📊</span>
              </h3>
              <p className="text-purple-100 text-lg">Real-time insights into leave patterns across departments</p>
              <div className="mt-4 flex space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="text-xs opacity-80">Avg Processing</span>
                  <p className="font-bold">{leaveStats?.trends?.averageProcessingTime || 2.3} days</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="text-xs opacity-80">Approval Rate</span>
                  <p className="font-bold">{leaveStats?.trends?.approvalRate || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 to-white">
            {leaveTypes.map((type, index) => {
              const typeRequests = leaveRequests.filter(l => l.type === type.value);
              const requestCount = typeRequests.length;
              const percentage = leaveRequests.length > 0 ? Math.round((requestCount / leaveRequests.length) * 100) : 0;
              return (
                <div key={type.value} className="group hover:bg-white p-4 rounded-2xl transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${type.color} text-white shadow-lg mr-4 transform group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-xl">{type.icon}</span>
                      </div>
                      <div>
                        <span className="font-bold text-lg text-gray-800">{type.label}</span>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-500 mr-2">({requestCount} requests)</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                            {percentage > 20 ? 'High' : percentage > 15 ? 'Medium' : 'Low'} Volume
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-2xl text-gray-900">{percentage}%</span>
                      <p className="text-xs text-gray-500">of total</p>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${type.color} rounded-full transition-all duration-1000 group-hover:shadow-lg`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-60"></div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supreme Quick Actions Panel */}
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 shadow-2xl border border-indigo-100">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Quick Actions</h3>
            <p className="text-gray-600">Streamline your workflow</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: UserCheck, label: 'Review Pending', count: leaveRequests.filter(l => l.status === 'pending').length, color: 'from-amber-500 to-orange-600', description: 'Needs approval', onClick: handleReviewPending },
              { icon: Calendar, label: 'Today\'s Leaves', count: leaveRequests.filter(l => l.status === 'approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length, color: 'from-blue-500 to-indigo-600', description: 'Staff on leave', onClick: handleTodaysLeaves },
              { icon: Download, label: 'Export Report', count: null, color: 'from-green-500 to-emerald-600', description: 'Download data', onClick: handleExportReport },
              { icon: Settings, label: 'Manage Policies', count: null, color: 'from-purple-500 to-pink-600', description: 'Configure system', onClick: handleManagePolicies }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="w-full group bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-white rounded-2xl p-5 flex items-center justify-between transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 border border-gray-100 hover:border-purple-200"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} group-hover:scale-125 transition-all duration-300 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <span className="font-bold text-gray-800 text-lg">{action.label}</span>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </div>
                  {action.count !== null ? (
                    <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-bold shadow-inner">
                      {action.count}
                    </span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spectacular Leave Requests Showcase */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
          <div className="absolute top-0 right-0 opacity-10">
            <Users className="w-40 h-40 animate-pulse" />
          </div>
          <div className="relative z-10 flex items-center justify-between text-white">
            <div>
              <h3 className="text-3xl font-bold flex items-center mb-3">
                <div className="relative mr-4">
                  <Calendar className="w-10 h-10" />
                  <div className="absolute inset-0 w-10 h-10 bg-white rounded-lg opacity-20 animate-ping"></div>
                </div>
                Recent Leave Requests
                <span className="ml-3 text-2xl animate-bounce">📋</span>
              </h3>
              <p className="text-purple-100 text-lg">Real-time overview of employee leave applications</p>
              <div className="mt-4 flex space-x-4 text-sm">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="opacity-80">Active Requests:</span>
                  <span className="font-bold ml-1">{leaveRequests.length}</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="opacity-80">Pending:</span>
                  <span className="font-bold ml-1">{leaveRequests.filter(l => l.status === 'pending').length}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-6 py-3 rounded-2xl flex items-center transition-all duration-300 transform hover:scale-105">
                <Filter className="w-5 h-5 mr-2" />
                Advanced Filter
              </button>
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-6 py-3 rounded-2xl flex items-center transition-all duration-300 transform hover:scale-105">
                <Search className="w-5 h-5 mr-2" />
                Search
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-300 opacity-30"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Loading Beautiful Data</h3>
            <p className="text-gray-500">Fetching the latest leave requests with style...</p>
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leave Requests Found</h3>
            <p className="text-gray-500">There are no leave requests to display at the moment.</p>
          </div>
        ) : (
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
            <div className="grid gap-6">
              {leaveRequests
                .sort((a, b) => new Date(b.appliedDate || b.createdAt) - new Date(a.appliedDate || a.createdAt))
                .slice(0, 10)
                .map((leave) => (
                <div
                  key={leave._id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -mr-16 -mt-16"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Professional Employee Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-xl text-white shadow-md">
                          {leave.employee?.avatar || (leave.employee?.firstName ? leave.employee.firstName[0].toUpperCase() : 'U')}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>

                      {/* Professional Employee Info */}
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-bold text-gray-900">
                            {leave.employee?.firstName || leave.employee?.name || 'Employee'} {leave.employee?.lastName || ''}
                          </h4>
                          {getStatusBadge(leave.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1 text-blue-500" />
                            {leave.employee?.position || 'Staff'}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-green-500" />
                            {leave.employee?.department || leave.department || 'General'}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-purple-500" />
                            {leave.totalDays} days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Professional Action Buttons */}
                    <div className="flex space-x-2">
                      {leave.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(leave._id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                            title="Approve Request"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(leave._id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                            title="Reject Request"
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Reject</span>
                          </button>
                        </>
                      )}
                      <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Professional Leave Details Panel */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500 font-medium">Leave Type</span>
                        <p className="font-semibold text-gray-800 flex items-center mt-1">
                          <span className="text-lg mr-2">{leaveTypes.find(t => t.value === leave.type)?.icon}</span>
                          {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Duration</span>
                        <p className="font-semibold text-gray-800 mt-1">
                          {leave.startDate ? format(new Date(leave.startDate), 'MMM dd') : 'N/A'} - {leave.endDate ? format(new Date(leave.endDate), 'MMM dd') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Applied</span>
                        <p className="font-semibold text-gray-800 mt-1">
                          {leave.appliedDate ? format(new Date(leave.appliedDate), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium text-sm">Reason</span>
                      <p className="text-gray-700 mt-1 text-sm">
                        {leave.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Professional Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Leave Management System
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Professional healthcare workforce management with comprehensive leave tracking and analytics</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStaff.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Efficiency Rate</p>
                  <p className="text-2xl font-bold text-gray-900">98.7%</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Response</p>
                  <p className="text-2xl font-bold text-gray-900">0.8s</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Today</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.floor(totalStaff * 0.85)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <nav className="flex">
              {[
                { id: 'dashboard', label: 'Overview', icon: BarChart3 },
                { id: 'requests', label: 'All Requests', icon: FileText },
                { id: 'pending', label: 'Pending', icon: Clock },
                { id: 'approved', label: 'Approved', icon: CheckCircle },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 group relative flex items-center justify-center py-4 px-6 font-medium text-sm transition-all duration-300 ${
                      index === 0 ? 'rounded-l-xl' : ''
                    } ${
                      index === 4 ? 'rounded-r-xl' : ''
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-800 rounded-b-xl"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Dynamic Tab Content */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'requests' && (
          <LeaveRequestsList
            requests={leaveRequests}
            title="All Leave Requests"
            emptyMessage="No Leave Requests Found"
            headerColor="from-indigo-600 to-purple-600"
            onViewDetails={handleViewDetails}
          />
        )}
        {activeTab === 'pending' && (
          <LeaveRequestsList
            requests={leaveRequests.filter(l => l.status === 'pending')}
            title="Pending Approvals"
            emptyMessage="No Pending Requests"
            headerColor="from-amber-500 to-orange-600"
            onViewDetails={handleViewDetails}
          />
        )}
        {activeTab === 'approved' && (
          <LeaveRequestsList
            requests={leaveRequests.filter(l => l.status === 'approved')}
            title="Approved Leaves"
            emptyMessage="No Approved Requests"
            headerColor="from-green-500 to-emerald-600"
            onViewDetails={handleViewDetails}
          />
        )}
        {activeTab === 'analytics' && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-16 shadow-2xl text-center border border-purple-200">
            <TrendingUp className="h-24 w-24 text-purple-500 mx-auto mb-8" />
            <h3 className="text-4xl font-bold text-gray-900 mb-6">Advanced Analytics</h3>
            <p className="text-xl text-gray-600 mb-10">Deep insights into leave patterns, trends, and organizational health</p>
            <button className="px-12 py-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300">
              Explore Insights
            </button>
          </div>
        )}
      </div>

      {/* Beautiful Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fadeInUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-20">
                <FileText className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Calendar className="w-8 h-8 mr-3" />
                    Leave Request Details
                  </h2>
                  <p className="text-blue-100 mt-1">Complete information for this leave application</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Close"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Employee Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Employee Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-2xl text-white shadow-lg">
                      {selectedRequest.employee?.avatar || (selectedRequest.employee?.firstName ? selectedRequest.employee.firstName[0].toUpperCase() : 'U')}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {selectedRequest.employee?.firstName || selectedRequest.employee?.name || 'Employee'} {selectedRequest.employee?.lastName || ''}
                      </h4>
                      <p className="text-gray-600">{selectedRequest.employee?.position || 'Staff'}</p>
                      <p className="text-gray-500 text-sm">{selectedRequest.employee?.department || selectedRequest.department || 'General'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee ID:</span>
                      <span className="font-medium">{selectedRequest.employee?.employeeId || selectedRequest.employee?._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedRequest.employee?.email || 'Not available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-600" />
                  Leave Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Leave Type</label>
                      <div className="flex items-center mt-1">
                        <span className="text-2xl mr-2">{leaveTypes.find(t => t.value === selectedRequest.type)?.icon}</span>
                        <span className="font-bold text-gray-900">{selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)} Leave</span>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Duration</label>
                      <p className="font-bold text-gray-900 text-lg">{selectedRequest.totalDays} days</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p className="font-bold text-gray-900">{selectedRequest.startDate ? format(new Date(selectedRequest.startDate), 'EEEE, MMMM dd, yyyy') : 'Not specified'}</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">End Date</label>
                      <p className="font-bold text-gray-900">{selectedRequest.endDate ? format(new Date(selectedRequest.endDate), 'EEEE, MMMM dd, yyyy') : 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason and Additional Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Request Information
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <label className="text-sm font-medium text-gray-600">Reason for Leave</label>
                    <p className="text-gray-900 mt-2 leading-relaxed">{selectedRequest.reason || 'No reason provided'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Applied Date</label>
                      <p className="font-medium text-gray-900">{selectedRequest.appliedDate ? format(new Date(selectedRequest.appliedDate), 'MMMM dd, yyyy') : 'Not available'}</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Request ID</label>
                      <p className="font-medium text-gray-900 font-mono text-sm">{selectedRequest._id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest._id);
                        closeModal();
                      }}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Approve Request</span>
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest._id);
                        closeModal();
                      }}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Reject Request</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Custom Styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          25% { transform: translate(30px, -50px) scale(1.1) rotate(90deg); }
          50% { transform: translate(-20px, 20px) scale(0.9) rotate(180deg); }
          75% { transform: translate(50px, 30px) scale(1.05) rotate(270deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 6s ease infinite;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default UltraBeautifulLeaveManagement;