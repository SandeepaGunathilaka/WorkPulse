import React, { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays, startOfYear, endOfYear } from 'date-fns';
import {
  Plus,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  Search,
  TrendingUp,
  PieChart,
  BarChart3,
  MapPin,
  Phone,
  Eye,
  ChevronDown,
  ChevronUp,
  User,
  Star,
  Award,
  Activity,
  Shield
} from 'lucide-react';
import leaveService from '../../services/leaveService';
import { useToast } from '../../contexts/ToastContext';

const MyLeave = () => {
  // Add custom animations CSS
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modalEnter {
        0% {
          opacity: 0;
          transform: scale(0.8) translateY(-20px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes fadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      @keyframes slideInUp {
        0% {
          transform: translateY(30px);
          opacity: 0;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }

      .animate-slide-in-up {
        animation: slideInUp 0.4s ease-out forwards;
      }

      .animate-pulse-subtle {
        animation: pulse 2s infinite;
      }

      .shimmer {
        position: relative;
        overflow: hidden;
      }

      .shimmer::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
      }

      .shimmer:hover::before {
        left: 100%;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    year: new Date().getFullYear(),
    search: ''
  });

  // Form data
  const [formData, setFormData] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
    isHalfDay: false,
    halfDayType: 'morning'
  });

  const { showToast } = useToast() || {};

  // Get all blocked dates (dates with existing leaves)
  const getBlockedDates = () => {
    const blockedDates = [];

    leaves.forEach(leave => {
      // Skip rejected or cancelled leaves
      if (leave.status === 'rejected' || leave.status === 'cancelled') {
        return;
      }

      // When editing, skip the current leave being edited
      if (editingLeave && leave._id === editingLeave._id) {
        return;
      }

      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      // Add all dates between start and end (inclusive)
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        blockedDates.push(d.toISOString().split('T')[0]);
      }
    });

    return blockedDates;
  };

  // Check if a specific date is blocked
  const isDateBlocked = (dateString) => {
    if (!dateString) return false;
    const blockedDates = getBlockedDates();
    return blockedDates.includes(dateString);
  };

  // Validate date selection
  const handleDateChange = (field, value) => {
    if (isDateBlocked(value)) {
      if (showToast) {
        showToast('This date already has a leave application. Please select a different date.', 'error');
      }
      return; // Don't update if date is blocked
    }

    if (field === 'startDate') {
      setFormData({
        ...formData,
        startDate: value,
        endDate: formData.isHalfDay ? value : (value > formData.endDate ? value : formData.endDate)
      });
    } else {
      setFormData({ ...formData, endDate: value });
    }
  };

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', icon: '🏥', color: 'from-red-400 to-rose-600', bgColor: 'bg-red-50', textColor: 'text-red-800' },
    { value: 'annual', label: 'Annual Leave', icon: '🏖️', color: 'from-blue-400 to-indigo-600', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
    { value: 'casual', label: 'Casual Leave', icon: '😊', color: 'from-purple-400 to-violet-600', bgColor: 'bg-purple-50', textColor: 'text-purple-800' },
    { value: 'personal', label: 'Personal Leave', icon: '👤', color: 'from-gray-400 to-slate-600', bgColor: 'bg-gray-50', textColor: 'text-gray-800' },
    { value: 'emergency', label: 'Emergency', icon: '🚨', color: 'from-orange-400 to-amber-600', bgColor: 'bg-orange-50', textColor: 'text-orange-800' },
    { value: 'maternity', label: 'Maternity', icon: '👶', color: 'from-pink-400 to-fuchsia-600', bgColor: 'bg-pink-50', textColor: 'text-pink-800' },
    { value: 'paternity', label: 'Paternity', icon: '👨‍👶', color: 'from-green-400 to-emerald-600', bgColor: 'bg-green-50', textColor: 'text-green-800' }
  ];

  // Load data on component mount
  useEffect(() => {
    fetchLeaveData();
    fetchLeaveBalance();
  }, [filters]);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      // Fetch real leave data from backend
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.year) params.year = filters.year;
      if (filters.search) params.search = filters.search;

      const response = await leaveService.getMyLeaves(params);

      if (response.success) {
        setLeaves(response.data || []);

        // Calculate summary statistics from actual data
        const leaves = response.data || [];
        const summary = {
          totalRequests: leaves.length,
          approvedLeaves: leaves.filter(leave => leave.status === 'approved').length,
          pendingLeaves: leaves.filter(leave => leave.status === 'pending').length,
          rejectedLeaves: leaves.filter(leave => leave.status === 'rejected').length,
          totalDaysUsed: leaves
            .filter(leave => leave.status === 'approved')
            .reduce((total, leave) => total + (leave.totalDays || 0), 0)
        };
        setLeaveSummary(summary);
      } else {
        if (showToast) {
          showToast(response.message || 'Failed to load leave data', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      if (showToast) {
        showToast(error.message || 'Failed to load leave data', 'error');
      }
      // Set empty state on error
      setLeaves([]);
      setLeaveSummary({
        totalRequests: 0,
        approvedLeaves: 0,
        pendingLeaves: 0,
        rejectedLeaves: 0,
        totalDaysUsed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      // Fetch real leave balance from backend
      const response = await leaveService.getLeaveBalance();

      if (response.success) {
        setLeaveBalance(response.data);
      } else {
        console.error('Failed to fetch leave balance:', response.message);
        if (showToast) {
          showToast(response.message || 'Failed to load leave balance', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      if (showToast) {
        showToast(error.message || 'Failed to load leave balance', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check for date conflicts with existing leaves (only for new applications)
      if (!editingLeave) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        const hasConflict = leaves.some(leave => {
          // Skip rejected or cancelled leaves
          if (leave.status === 'rejected' || leave.status === 'cancelled') {
            return false;
          }

          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);

          // Check if dates overlap
          return (startDate <= leaveEnd && endDate >= leaveStart);
        });

        if (hasConflict) {
          if (showToast) {
            showToast('You already have a leave application for the selected date range. Please choose different dates.', 'error');
          }
          setSubmitting(false);
          return;
        }
      }

      const submitData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      let response;
      if (editingLeave) {
        // Update existing leave request
        response = await leaveService.updateLeave(editingLeave._id, submitData);
      } else {
        // Create new leave request
        response = await leaveService.applyLeave(submitData);
      }

      if (response.success) {
        if (showToast) {
          showToast(
            editingLeave ? 'Leave request updated successfully! ✨' : 'Leave request submitted successfully! 🎉',
            'success'
          );
        }
        setShowLeaveForm(false);
        resetForm();
        fetchLeaveData();
        fetchLeaveBalance(); // Refresh balance after submitting
      } else {
        if (showToast) {
          showToast(response.message || 'Failed to submit leave request', 'error');
        }
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      if (showToast) {
        showToast(error.message || 'Failed to submit leave request', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (leave) => {
    if (leave.status !== 'pending') {
      if (showToast) {
        showToast('Only pending leave requests can be edited', 'warning');
      }
      return;
    }

    setEditingLeave(leave);
    setFormData({
      type: leave.type,
      startDate: format(parseISO(leave.startDate), 'yyyy-MM-dd'),
      endDate: format(parseISO(leave.endDate), 'yyyy-MM-dd'),
      reason: leave.reason,
      emergencyContact: leave.emergencyContact || '',
      isHalfDay: leave.isHalfDay || false,
      halfDayType: leave.halfDayType || 'morning'
    });
    setShowLeaveForm(true);
  };

  const handleCancel = async (leave) => {
    if (leave.status !== 'pending') {
      if (showToast) {
        showToast('Only pending leave requests can be cancelled', 'warning');
      }
      return;
    }

    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        const response = await leaveService.cancelLeave(leave._id);

        if (response.success) {
          if (showToast) {
            showToast('Leave request cancelled successfully', 'success');
          }
          fetchLeaveData();
          fetchLeaveBalance(); // Refresh balance after cancelling
        } else {
          if (showToast) {
            showToast(response.message || 'Failed to cancel leave request', 'error');
          }
        }
      } catch (error) {
        console.error('Error cancelling leave:', error);
        if (showToast) {
          showToast(error.message || 'Failed to cancel leave request', 'error');
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
      emergencyContact: '',
      isHalfDay: false,
      halfDayType: 'morning'
    });
    setEditingLeave(null);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getLeaveTypeDetails = (type) => {
    return leaveTypes.find(t => t.value === type) || leaveTypes[0];
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filters.status && leave.status !== filters.status) return false;
    if (filters.type && leave.type !== filters.type) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        leave.reason.toLowerCase().includes(searchLower) ||
        leave.type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Professional Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  My Leave Requests
                </h1>
                <p className="text-lg text-gray-600">Manage your time off and leave applications</p>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="text-center">
            <button
              onClick={() => {
                resetForm();
                setShowLeaveForm(true);
              }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="h-6 w-6 mr-3" />
              Apply for New Leave
            </button>
          </div>
        </div>

        {/* Professional Leave Balance Cards */}
        {leaveBalance && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(leaveBalance.balance).map(([type, balance]) => {
              const typeDetails = getLeaveTypeDetails(type);
              const usagePercentage = (balance.used / balance.entitled) * 100;

              return (
                <div key={type} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${typeDetails.color} flex items-center justify-center text-white text-xl shadow-md`}>
                        {typeDetails.icon}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-bold text-gray-800 capitalize">{type} Leave</h3>
                        <p className="text-sm text-gray-500">{typeDetails.label}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Entitled:</span>
                      <span className="font-semibold text-gray-800">{balance.entitled} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Used:</span>
                      <span className="font-semibold text-red-600">{balance.used} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className="font-bold text-green-600">{balance.remaining} days</span>
                    </div>

                    {/* Professional Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Usage</span>
                        <span>{Math.round(usagePercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full bg-gradient-to-r ${typeDetails.color} transition-all duration-1000`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Professional Summary Stats */}
        {leaveSummary && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              Leave Summary - This Year
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">{leaveSummary.totalRequests}</div>
                <div className="text-sm text-gray-600 font-medium">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">{leaveSummary.approvedLeaves}</div>
                <div className="text-sm text-gray-600 font-medium">Approved</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">{leaveSummary.pendingLeaves}</div>
                <div className="text-sm text-gray-600 font-medium">Pending</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">{leaveSummary.rejectedLeaves}</div>
                <div className="text-sm text-gray-600 font-medium">Rejected</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">{leaveSummary.totalDaysUsed}</div>
                <div className="text-sm text-gray-600 font-medium">Days Used</div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Filter className="h-5 w-5 text-blue-600 mr-2" />
              Filter & Search
            </h3>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leaves..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-64"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              {/* Status Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Type Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                {leaveTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Professional Leave History Cards */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              Leave History
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
              </div>
              <p className="text-gray-600 font-medium ml-4 text-lg">Loading leave history...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-gray-700 mb-2">No leave records found</p>
              <p className="text-gray-500">Start by applying for your first leave request</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-6">
                {filteredLeaves.map((leave) => {
                  const typeDetails = getLeaveTypeDetails(leave.type);
                  return (
                    <div
                      key={leave._id}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Leave Type Icon */}
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${typeDetails.color} flex items-center justify-center text-white text-2xl shadow-lg`}>
                            {typeDetails.icon}
                          </div>

                          {/* Leave Details */}
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">
                                {typeDetails.label}
                              </h4>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(leave.status)}`}>
                                {getStatusIcon(leave.status)}
                                <span className="ml-2 capitalize">{leave.status}</span>
                              </span>
                              {leave.isHalfDay && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Half Day ({leave.halfDayType})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                                {format(parseISO(leave.startDate), 'MMM dd')} - {format(parseISO(leave.endDate), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-green-500" />
                                {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                              </span>
                              <span className="flex items-center">
                                <User className="w-4 h-4 mr-1 text-purple-500" />
                                Applied {format(parseISO(leave.appliedDate), 'MMM dd')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowDetails(true);
                            }}
                            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
                            title="View Leave Details"
                          >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -top-10 -left-10 w-10 h-10 bg-white opacity-30 rotate-12 scale-110 group-hover:translate-x-full group-hover:translate-y-full transition-transform duration-700 ease-out"></div>

                            {/* Icon with animation */}
                            <Eye className="h-5 w-5 transform group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-sm font-semibold">View Details</span>

                            {/* Ripple effect */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                          </button>

                          {leave.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleEdit(leave)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="text-sm font-medium">Edit</span>
                              </button>
                              <button
                                onClick={() => handleCancel(leave)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                                title="Cancel"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Cancel</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Leave Reason */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-500 font-medium">Reason:</span>
                        <p className="text-gray-700 mt-1">{leave.reason}</p>
                        {leave.emergencyContact && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-500 font-medium">Emergency Contact:</span>
                            <p className="text-gray-700">{leave.emergencyContact}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Leave Application Modal */}
        {showLeaveForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingLeave ? 'Edit Leave Request' : 'Apply for Leave'}
                </h3>
                <button
                  onClick={() => {
                    setShowLeaveForm(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    {leaveTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Half Day Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="halfDay"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  />
                  <label htmlFor="halfDay" className="text-sm font-medium text-gray-700">
                    Half Day Leave
                  </label>

                  {formData.isHalfDay && (
                    <select
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      value={formData.halfDayType}
                      onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                    </select>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                      {getBlockedDates().length > 0 && (
                        <span className="text-xs text-red-500 ml-2">
                          (Some dates unavailable due to existing leaves)
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-colors ${
                        isDateBlocked(formData.startDate)
                          ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      value={formData.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    {isDateBlocked(formData.startDate) && (
                      <p className="text-xs text-red-500 mt-1">
                        This date has an existing leave application
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                      {getBlockedDates().length > 0 && (
                        <span className="text-xs text-red-500 ml-2">
                          (Some dates unavailable due to existing leaves)
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-colors ${
                        isDateBlocked(formData.endDate)
                          ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      value={formData.endDate}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      required
                      disabled={formData.isHalfDay}
                    />
                    {isDateBlocked(formData.endDate) && (
                      <p className="text-xs text-red-500 mt-1">
                        This date has an existing leave application
                      </p>
                    )}
                  </div>
                </div>

                {/* Show blocked dates information */}
                {getBlockedDates().length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <h4 className="text-sm font-medium text-yellow-800">Unavailable Dates</h4>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">
                      The following dates already have leave applications:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getBlockedDates().slice(0, 10).map((date, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs"
                        >
                          {new Date(date + 'T00:00:00').toLocaleDateString()}
                        </span>
                      ))}
                      {getBlockedDates().length > 10 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs">
                          +{getBlockedDates().length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows="3"
                    placeholder="Please provide a reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Emergency contact number or email"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>

                {/* Calculated Days */}
                {formData.startDate && formData.endDate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">
                        Total Leave Days: {' '}
                        {formData.isHalfDay
                          ? '0.5 days'
                          : `${Math.max(1, differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1)} days`
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeaveForm(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        {editingLeave ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      editingLeave ? 'Update Request' : 'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ultra Beautiful Leave Details Modal */}
        {showDetails && selectedLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto overflow-x-hidden shadow-2xl transform transition-all duration-500 scale-100 animate-modal-enter"
                 style={{
                   animation: 'modalEnter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                 }}>
              {/* Beautiful Header with Gradient */}
              <div className={`relative p-4 sm:p-6 md:p-8 bg-gradient-to-br ${getLeaveTypeDetails(selectedLeave.type).color} text-white overflow-hidden shimmer`}>
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16 animate-pulse-subtle"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -ml-10 -mb-10 animate-pulse-subtle" style={{animationDelay: '1s'}}></div>

                <div className="relative flex items-center justify-between animate-slide-in-up">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl backdrop-blur-sm border border-white border-opacity-30 transform hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      {getLeaveTypeDetails(selectedLeave.type).icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-2xl font-bold mb-1 animate-slide-in-up truncate" style={{animationDelay: '0.1s'}}>Leave Details</h3>
                      <p className="text-white text-opacity-90 text-sm sm:text-lg animate-slide-in-up truncate" style={{animationDelay: '0.2s'}}>
                        {getLeaveTypeDetails(selectedLeave.type).label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="group p-2 sm:p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white border-opacity-30 transform hover:scale-110 hover:rotate-90 flex-shrink-0"
                  >
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-spin" />
                  </button>
                </div>
              </div>

              {/* Beautiful Content */}
              <div className="p-4 sm:p-6 md:p-8">
                {/* Status Badge */}
                <div className="flex justify-center mb-8 animate-slide-in-up" style={{animationDelay: '0.3s'}}>
                  <span className={`inline-flex items-center px-6 py-3 rounded-2xl text-base font-semibold border-2 shadow-lg ${getStatusColor(selectedLeave.status)} transform hover:scale-105 transition-transform duration-300 shimmer`}>
                    {getStatusIcon(selectedLeave.status)}
                    <span className="ml-3 capitalize">{selectedLeave.status}</span>
                  </span>
                </div>

                {/* Key Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Duration Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 transform hover:scale-105 transition-all duration-300 shimmer animate-slide-in-up" style={{animationDelay: '0.4s'}}>
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300 shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-bold text-blue-900">Duration</h4>
                        <p className="text-blue-700">
                          {selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'day' : 'days'}
                          {selectedLeave.isHalfDay && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 animate-pulse-subtle">
                              {selectedLeave.halfDayType} half
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dates Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 transform hover:scale-105 transition-all duration-300 shimmer animate-slide-in-up" style={{animationDelay: '0.5s'}}>
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300 shadow-lg">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-bold text-purple-900">Leave Period</h4>
                        <div className="text-purple-700">
                          <div className="font-medium">
                            {format(parseISO(selectedLeave.startDate), 'EEEE, MMM dd, yyyy')}
                          </div>
                          {selectedLeave.startDate !== selectedLeave.endDate && (
                            <div className="text-sm mt-1">
                              to {format(parseISO(selectedLeave.endDate), 'EEEE, MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Section */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200 mb-6 transform hover:scale-105 transition-all duration-300 shimmer animate-slide-in-up" style={{animationDelay: '0.6s'}}>
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0 transform hover:rotate-12 transition-transform duration-300 shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Reason for Leave</h4>
                      <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                        {selectedLeave.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                {selectedLeave.emergencyContact && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 mb-6 transform hover:scale-105 transition-all duration-300 shimmer animate-slide-in-up" style={{animationDelay: '0.7s'}}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300 shadow-lg">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-bold text-amber-900 mb-1">Emergency Contact</h4>
                        <p className="text-amber-800 font-medium text-lg">{selectedLeave.emergencyContact}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 transform hover:scale-105 transition-all duration-300 shimmer animate-slide-in-up" style={{animationDelay: '0.8s'}}>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300 shadow-lg">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-green-900 ml-4">Application Timeline</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-green-200 hover:shadow-md transition-all duration-300 transform hover:scale-102 animate-slide-in-up" style={{animationDelay: '0.9s'}}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse-subtle"></div>
                        <span className="text-green-800 font-medium">Applied</span>
                      </div>
                      <span className="text-green-700 text-sm">
                        {format(parseISO(selectedLeave.appliedDate), 'MMM dd, yyyy \'at\' HH:mm')}
                      </span>
                    </div>

                    {selectedLeave.approvedDate && (
                      <div className="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-green-200 hover:shadow-md transition-all duration-300 transform hover:scale-102 animate-slide-in-up" style={{animationDelay: '1.0s'}}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse-subtle"></div>
                          <span className="text-blue-800 font-medium">Approved</span>
                        </div>
                        <span className="text-blue-700 text-sm">
                          {format(parseISO(selectedLeave.approvedDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}

                    {selectedLeave.rejectedDate && (
                      <div className="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-red-200 hover:shadow-md transition-all duration-300 transform hover:scale-102 animate-slide-in-up" style={{animationDelay: '1.0s'}}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse-subtle"></div>
                          <span className="text-red-800 font-medium">Rejected</span>
                        </div>
                        <span className="text-red-700 text-sm">
                          {format(parseISO(selectedLeave.rejectedDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Close Button */}
                <div className="flex justify-center mt-8 animate-slide-in-up" style={{animationDelay: '1.1s'}}>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="group relative px-10 py-4 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300 overflow-hidden shimmer"
                  >
                    {/* Button shimmer effect */}
                    <div className="absolute inset-0 -top-10 -left-10 w-10 h-10 bg-white opacity-20 rotate-12 scale-110 group-hover:translate-x-full group-hover:translate-y-full transition-transform duration-700 ease-out"></div>

                    {/* Button content */}
                    <span className="relative flex items-center space-x-2">
                      <XCircle className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span>Close Details</span>
                    </span>

                    {/* Button ripple effect */}
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"></div>
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

export default MyLeave;