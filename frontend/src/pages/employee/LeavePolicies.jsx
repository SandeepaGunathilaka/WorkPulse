import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, Users, ArrowLeft, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import leavePolicyService from '../../services/leavePolicyService';
import { useToast } from '../../contexts/ToastContext';

const LeavePolicies = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await leavePolicyService.getAllPolicies();
      console.log('📄 LeavePolicies - Response received:', response);
      if (response.success) {
        console.log('✅ LeavePolicies - Setting policies:', response.data);
        setPolicies(response.data || []);
      } else {
        console.log('❌ LeavePolicies - Error in response:', response.message);
        showError(response.message || 'Failed to fetch leave policies');
      }
    } catch (error) {
      console.error('❌ LeavePolicies - Catch block error:', error);
      showError('Failed to fetch leave policies');
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeIcon = (type) => {
    const iconMap = {
      'sick': '🏥',
      'annual': '🏖️',
      'personal': '👤',
      'emergency': '🚨',
      'maternity': '👶',
      'paternity': '👨‍👶'
    };
    return iconMap[type?.toLowerCase()] || '📝';
  };

  const getLeaveTypeColor = (type) => {
    const colorMap = {
      'sick': 'bg-red-500',
      'annual': 'bg-blue-500',
      'personal': 'bg-purple-500',
      'emergency': 'bg-orange-500',
      'maternity': 'bg-pink-500',
      'paternity': 'bg-green-500'
    };
    return colorMap[type?.toLowerCase()] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/employee/leaves')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Leave Management
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Leave Policies</h1>
            <p className="text-gray-600">Review company leave policies and entitlements</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center mb-3">
            <Info className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-800">Important Information</h3>
          </div>
          <p className="text-blue-700">
            These policies outline your leave entitlements, application procedures, and important guidelines.
            Please review them carefully before applying for leave.
          </p>
        </div>

        {/* Policies Grid */}
        {policies.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {policies.map((policy) => (
              <div key={policy.id} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
                {/* Policy Header */}
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 ${getLeaveTypeColor(policy.leaveType)} rounded-full flex items-center justify-center text-white text-2xl mr-4`}>
                    {getLeaveTypeIcon(policy.leaveType)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 capitalize">{policy.leaveType} Leave</h3>
                    <p className="text-gray-600">{policy.name}</p>
                  </div>
                </div>

                {/* Policy Details */}
                <div className="space-y-4">
                  {/* Annual Entitlement */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-green-800 font-medium">Annual Entitlement</span>
                    </div>
                    <span className="text-2xl font-bold text-green-700">{policy.annualEntitlement} days</span>
                  </div>

                  {/* Maximum Consecutive Days */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-blue-800 font-medium">Max Consecutive Days</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{policy.maxConsecutiveDays} days</span>
                  </div>

                  {/* Advance Notice Required */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                      <span className="text-orange-800 font-medium">Advance Notice</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-700">{policy.advanceNoticeRequired} days</span>
                  </div>

                  {/* Requires Approval */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-purple-800 font-medium">Approval Required</span>
                    </div>
                    <div className="flex items-center">
                      {policy.requiresApproval ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-400 rounded-full"></div>
                      )}
                      <span className="text-purple-700 font-medium ml-2">
                        {policy.requiresApproval ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {policy.description && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Policy Description
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{policy.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Leave Policies Available</h3>
            <p className="text-gray-500">Leave policies have not been configured yet.</p>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center mb-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
            <h3 className="text-lg font-semibold text-yellow-800">Please Note</h3>
          </div>
          <div className="text-yellow-700 space-y-2">
            <p>• These policies are subject to company terms and conditions.</p>
            <p>• Leave applications must be submitted according to the advance notice requirements.</p>
            <p>• Approval is required for most leave types and is subject to operational requirements.</p>
            <p>• For questions about leave policies, please contact your HR department.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeavePolicies;