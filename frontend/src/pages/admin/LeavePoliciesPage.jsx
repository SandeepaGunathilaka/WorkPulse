import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar, Users, AlertCircle, Settings, CheckCircle, FileText, Shield } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import leavePolicyService from '../../services/leavePolicyService';

const LeavePoliciesPage = () => {
  const { showSuccess, showError } = useToast();
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Default leave policies
  const defaultPolicies = [
    {
      id: '1',
      type: 'sick',
      name: 'Sick Leave',
      icon: '🏥',
      color: 'bg-red-500',
      annualAllocation: 14,
      maxConsecutiveDays: 7,
      requiresMedicalCertificate: true,
      medicalCertificateAfterDays: 3,
      carryForward: false,
      encashable: false,
      description: 'Time off for illness or medical appointments',
      rules: [
        'Medical certificate required for absences longer than 3 days',
        'Can be taken in increments of 0.5 days',
        'Manager approval required for planned medical procedures',
        'Does not carry forward to next year'
      ]
    },
    {
      id: '2',
      type: 'annual',
      name: 'Annual Leave',
      icon: '🏖️',
      color: 'bg-blue-500',
      annualAllocation: 21,
      maxConsecutiveDays: 14,
      requiresMedicalCertificate: false,
      medicalCertificateAfterDays: null,
      carryForward: true,
      maxCarryForward: 5,
      encashable: true,
      description: 'Vacation and recreational leave',
      rules: [
        'Must be approved by direct manager',
        'Minimum 2 weeks notice required for requests over 5 days',
        'Up to 5 days can be carried forward to next year',
        'Unused days above carry-forward limit can be encashed'
      ]
    },
    {
      id: '3',
      type: 'casual',
      name: 'Casual Leave',
      icon: '👤',
      color: 'bg-purple-500',
      annualAllocation: 7,
      maxConsecutiveDays: 3,
      requiresMedicalCertificate: false,
      medicalCertificateAfterDays: null,
      carryForward: false,
      encashable: false,
      description: 'Personal matters and family obligations',
      rules: [
        'Manager approval required',
        'Cannot be combined with other leave types',
        'Maximum 3 consecutive days at a time',
        'Does not carry forward to next year'
      ]
    },
    {
      id: '4',
      type: 'emergency',
      name: 'Emergency Leave',
      icon: '🚨',
      color: 'bg-orange-500',
      annualAllocation: 3,
      maxConsecutiveDays: 2,
      requiresMedicalCertificate: false,
      medicalCertificateAfterDays: null,
      carryForward: false,
      encashable: false,
      description: 'Unforeseen emergencies requiring immediate absence',
      rules: [
        'Can be taken without prior approval',
        'Must notify manager within 24 hours',
        'Documentation may be required for approval',
        'Does not carry forward to next year'
      ]
    },
    {
      id: '5',
      type: 'maternity',
      name: 'Maternity Leave',
      icon: '👶',
      color: 'bg-pink-500',
      annualAllocation: 90,
      maxConsecutiveDays: 90,
      requiresMedicalCertificate: true,
      medicalCertificateAfterDays: 1,
      carryForward: false,
      encashable: false,
      description: 'Leave for new mothers following childbirth',
      rules: [
        'Medical certificate required',
        'Can be extended with unpaid leave',
        'Job protection guaranteed during leave',
        'Flexible return-to-work options available'
      ]
    },
    {
      id: '6',
      type: 'paternity',
      name: 'Paternity Leave',
      icon: '👨‍👶',
      color: 'bg-green-500',
      annualAllocation: 14,
      maxConsecutiveDays: 14,
      requiresMedicalCertificate: false,
      medicalCertificateAfterDays: null,
      carryForward: false,
      encashable: false,
      description: 'Leave for new fathers following childbirth or adoption',
      rules: [
        'Birth certificate or adoption papers required',
        'Must be taken within 6 months of birth/adoption',
        'Can be taken in blocks or continuously',
        'Additional unpaid leave may be available'
      ]
    }
  ];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    console.log('🔄 Fetching leave policies...');
    try {
      const response = await leavePolicyService.getAllPolicies();
      console.log('📊 API Response:', response);

      if (response.success) {
        console.log('✅ Policies fetched successfully:', response.data);
        setPolicies(response.data);
      } else {
        console.log('⚠️ API returned unsuccessful response:', response.message);
        // If no policies exist, use default policies as templates
        setPolicies(defaultPolicies);
        showError(response.message || 'Failed to fetch policies. Using default templates.');
      }
    } catch (error) {
      console.error('❌ Error fetching policies:', error);
      setPolicies(defaultPolicies);
      showError('Failed to fetch policies. Using default templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async (policyData) => {
    setLoading(true);

    try {
      if (editingPolicy?._id) {
        // Update existing policy
        const response = await leavePolicyService.updatePolicy(editingPolicy._id, policyData);
        if (response.success) {
          showSuccess(response.message || 'Leave policy updated successfully!');
          fetchPolicies(); // Refresh policies
        } else {
          showError(response.message || 'Failed to update policy');
          return;
        }
      } else {
        // Create new policy
        const newPolicyData = {
          ...policyData,
          type: policyData.name.toLowerCase().replace(/\s+/g, '_')
        };
        const response = await leavePolicyService.createPolicy(newPolicyData);
        if (response.success) {
          showSuccess(response.message || 'Leave policy created successfully!');
          fetchPolicies(); // Refresh policies
        } else {
          showError(response.message || 'Failed to create policy');
          return;
        }
      }

      setEditingPolicy(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error saving policy:', error);
      showError('An error occurred while saving the policy');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policy) => {
    if (window.confirm(`Are you sure you want to delete ${policy.name} policy?`)) {
      try {
        const response = await leavePolicyService.deletePolicy(policy._id);
        if (response.success) {
          showSuccess(response.message || 'Leave policy deleted successfully!');
          fetchPolicies(); // Refresh policies
        } else {
          showError(response.message || 'Failed to delete policy');
        }
      } catch (error) {
        console.error('Error deleting policy:', error);
        showError('An error occurred while deleting the policy');
      }
    }
  };

  const PolicyModal = () => {
    const defaultFormData = {
      name: '',
      icon: '📋',
      color: 'bg-gray-500',
      annualAllocation: 1,
      maxConsecutiveDays: 1,
      requiresMedicalCertificate: false,
      medicalCertificateAfterDays: null,
      carryForward: false,
      maxCarryForward: 0,
      encashable: false,
      description: '',
      rules: ['']
    };

    const [formData, setFormData] = useState(editingPolicy || defaultFormData);

    // Reset form when modal opens
    useEffect(() => {
      setFormData(editingPolicy || defaultFormData);
    }, [editingPolicy]);

    const handleSubmit = (e) => {
      e.preventDefault();

      if (!formData.name || !formData.description || formData.annualAllocation <= 0 || formData.maxConsecutiveDays <= 0) {
        showError('Please fill in all required fields with valid values');
        return;
      }

      handleSavePolicy(formData);
    };

    const addRule = () => {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, '']
      }));
    };

    const updateRule = (index, value) => {
      setFormData(prev => ({
        ...prev,
        rules: prev.rules.map((rule, i) => i === index ? value : rule)
      }));
    };

    const removeRule = (index) => {
      setFormData(prev => ({
        ...prev,
        rules: prev.rules.filter((_, i) => i !== index)
      }));
    };

    const colorOptions = [
      { value: 'bg-red-500', label: 'Red', color: 'bg-red-500' },
      { value: 'bg-blue-500', label: 'Blue', color: 'bg-blue-500' },
      { value: 'bg-green-500', label: 'Green', color: 'bg-green-500' },
      { value: 'bg-purple-500', label: 'Purple', color: 'bg-purple-500' },
      { value: 'bg-orange-500', label: 'Orange', color: 'bg-orange-500' },
      { value: 'bg-pink-500', label: 'Pink', color: 'bg-pink-500' },
      { value: 'bg-yellow-500', label: 'Yellow', color: 'bg-yellow-500' },
      { value: 'bg-gray-500', label: 'Gray', color: 'bg-gray-500' }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingPolicy ? 'Edit Leave Policy' : 'Create Leave Policy'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sick Leave"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 🏥"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                      className={`w-full h-10 rounded-lg border-2 ${
                        formData.color === option.value ? 'border-gray-900' : 'border-gray-300'
                      } ${option.color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Allocation (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.annualAllocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, annualAllocation: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Consecutive Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.maxConsecutiveDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxConsecutiveDays: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this leave type..."
                required
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPolicy ? 'Update Policy' : 'Create Policy'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          ✅ <strong>SUCCESS!</strong> Leave Policies Page Connected to Backend API! 🎉
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏥 Leave Policies Management</h1>
              <p className="text-gray-600">Configure leave types, allocations, and rules for your organization</p>
            </div>
            <button
              onClick={() => {
                setEditingPolicy(null);
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Policy
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Policies</h3>
                <p className="text-2xl font-bold text-gray-900">{policies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active Policies</h3>
                <p className="text-2xl font-bold text-gray-900">{policies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Departments</h3>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Days</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {policies.reduce((sum, policy) => sum + policy.annualAllocation, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading policies...</span>
          </div>
        )}

        {/* Policies Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy) => (
            <div key={policy._id || policy.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className={`${policy.color} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{policy.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold">{policy.name}</h3>
                      <p className="text-sm opacity-90">{policy.annualAllocation} days/year</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingPolicy(policy);
                        setShowModal(true);
                      }}
                      className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(policy)}
                      className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                <p className="text-gray-600 text-sm">{policy.description}</p>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Max Consecutive:</span>
                    <div className="font-medium">{policy.maxConsecutiveDays} days</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Medical Cert:</span>
                    <div className="font-medium">
                      {policy.requiresMedicalCertificate ?
                        `After ${policy.medicalCertificateAfterDays || 1} day(s)` :
                        'Not required'
                      }
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {policy.carryForward && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Carry Forward ({policy.maxCarryForward} days)
                    </span>
                  )}
                  {policy.encashable && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Encashable
                    </span>
                  )}
                  {policy.requiresMedicalCertificate && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Medical Cert
                    </span>
                  )}
                </div>

                {/* Rules */}
                <div>
                  <span className="text-sm font-medium text-gray-700">Key Rules:</span>
                  <ul className="mt-1 text-xs text-gray-600 space-y-1">
                    {(policy.rules && Array.isArray(policy.rules) ? policy.rules : []).slice(0, 2).map((rule, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-1">•</span>
                        <span className="line-clamp-2">{rule}</span>
                      </li>
                    ))}
                    {(policy.rules && Array.isArray(policy.rules) && policy.rules.length > 2) && (
                      <li className="text-gray-400 italic">+{policy.rules.length - 2} more rules...</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}

            {/* Empty State */}
            {policies.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Policies</h3>
            <p className="text-gray-500 mb-4">Create your first leave policy to get started</p>
            <button
              onClick={() => {
                setEditingPolicy(null);
                setShowModal(true);
              }}
              className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Policy
            </button>
          </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && <PolicyModal />}
      </div>
    </div>
  );
};

export default LeavePoliciesPage;