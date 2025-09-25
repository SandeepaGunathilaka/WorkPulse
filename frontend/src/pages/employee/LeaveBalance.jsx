import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  Download,
  PieChart,
  BarChart3,
  Activity
} from 'lucide-react';
import leaveService from '../../services/leaveService';
import { useToast } from '../../contexts/ToastContext';
import { format } from 'date-fns';

const LeaveBalance = () => {
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const leaveTypeDetails = {
    annual: {
      label: 'Annual Leave',
      icon: '🏖️',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    sick: {
      label: 'Sick Leave',
      icon: '🏥',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    },
    casual: {
      label: 'Casual Leave',
      icon: '⏰',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    maternity: {
      label: 'Maternity Leave',
      icon: '👶',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700'
    },
    paternity: {
      label: 'Paternity Leave',
      icon: '👨‍👧',
      color: 'from-teal-500 to-green-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-700'
    },
    personal: {
      label: 'Personal Leave',
      icon: '🏠',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700'
    },
    study: {
      label: 'Study Leave',
      icon: '📚',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700'
    },
    unpaid: {
      label: 'Unpaid Leave',
      icon: '💸',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700'
    },
    emergency: {
      label: 'Emergency Leave',
      icon: '🚨',
      color: 'from-red-600 to-orange-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-800'
    }
  };

  useEffect(() => {
    fetchLeaveBalance();
  }, [selectedYear]);

  const fetchLeaveBalance = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getLeaveBalance();
      setLeaveBalances(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      showToast('Failed to load leave balance', 'error');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveBalance();
    setRefreshing(false);
    showToast('Leave balance refreshed', 'success');
  };

  const calculateTotalBalance = () => {
    if (!leaveBalances) return { entitled: 0, used: 0, remaining: 0 };

    let totalEntitled = 0;
    let totalUsed = 0;
    let totalRemaining = 0;

    Object.values(leaveBalances).forEach(balance => {
      totalEntitled += balance.entitled || 0;
      totalUsed += balance.used || 0;
      totalRemaining += balance.remaining || 0;
    });

    return {
      entitled: totalEntitled,
      used: totalUsed,
      remaining: totalRemaining
    };
  };

  const getUsagePercentage = (used, entitled) => {
    if (!entitled || entitled === 0) return 0;
    return Math.round((used / entitled) * 100);
  };

  const totals = calculateTotalBalance();
  const overallUsagePercentage = getUsagePercentage(totals.used, totals.entitled);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading leave balance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Leave Balance Overview</h1>
              <p className="text-gray-600">Track your leave entitlements and usage for {selectedYear}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Entitled */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{totals.entitled}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Entitled</h3>
            <p className="text-xs text-gray-500">Days available for the year</p>
          </div>

          {/* Total Used */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{totals.used}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Used</h3>
            <p className="text-xs text-gray-500">Days consumed so far</p>
          </div>

          {/* Total Remaining */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{totals.remaining}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Remaining</h3>
            <p className="text-xs text-gray-500">Days available to use</p>
          </div>

          {/* Usage Percentage */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{overallUsagePercentage}%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Overall Usage</h3>
            <p className="text-xs text-gray-500">Percentage of leaves used</p>
          </div>
        </div>

        {/* Leave Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaveBalances && Object.entries(leaveBalances).map(([type, balance]) => {
            const typeDetail = leaveTypeDetails[type] || leaveTypeDetails.casual;
            const usagePercentage = getUsagePercentage(balance.used, balance.entitled);

            return (
              <div
                key={type}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:scale-105 transform"
              >
                {/* Card Header with Gradient */}
                <div className={`p-4 bg-gradient-to-r ${typeDetail.color} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{typeDetail.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold">{typeDetail.label}</h3>
                        <p className="text-white text-opacity-90 text-sm">Leave Balance</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Balance Details */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Entitled</span>
                      <span className="font-bold text-gray-800">{balance.entitled || 0} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Used</span>
                      <span className="font-bold text-red-600">{balance.used || 0} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Remaining</span>
                      <span className="font-bold text-green-600">{balance.remaining || 0} days</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Usage Progress</span>
                      <span>{usagePercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${typeDetail.color} transition-all duration-1000`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className={`p-3 ${typeDetail.bgColor} ${typeDetail.borderColor} border rounded-lg`}>
                    <div className="flex items-center gap-2">
                      {balance.remaining > 0 ? (
                        <>
                          <CheckCircle className={`w-4 h-4 ${typeDetail.textColor}`} />
                          <span className={`text-sm font-medium ${typeDetail.textColor}`}>
                            {balance.remaining} days available
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-600">
                            No days remaining
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {balance.pendingRequests > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-yellow-700">
                          {balance.pendingRequests} pending request(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Leave balances are updated in real-time as requests are approved</li>
                <li>• Unused annual leave may be carried forward based on company policy</li>
                <li>• Emergency leave is subject to management approval</li>
                <li>• Contact HR for any discrepancies in your leave balance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalance;