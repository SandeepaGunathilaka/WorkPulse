import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, User, MapPin, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import leaveService from '../../services/leaveService';
import { useToast } from '../../contexts/ToastContext';

const ApplyLeave = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
    location: ''
  });
  const [leaveBalance, setLeaveBalance] = useState({});
  const [existingLeaves, setExistingLeaves] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', icon: '🏥', color: 'bg-red-500' },
    { value: 'annual', label: 'Annual Leave', icon: '🏖️', color: 'bg-blue-500' },
    { value: 'personal', label: 'Personal Leave', icon: '👤', color: 'bg-purple-500' },
    { value: 'emergency', label: 'Emergency Leave', icon: '🚨', color: 'bg-orange-500' },
    { value: 'maternity', label: 'Maternity Leave', icon: '👶', color: 'bg-pink-500' },
    { value: 'paternity', label: 'Paternity Leave', icon: '👨‍👶', color: 'bg-green-500' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch existing leaves for date blocking
      const leavesResponse = await leaveService.getMyLeaves();

      if (leavesResponse.success) {
        setExistingLeaves(leavesResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
      showError('Failed to fetch leave data');
    } finally {
      setLoading(false);
    }
  };

  // Get all blocked dates (dates with existing leaves)
  const getBlockedDates = () => {
    const blockedDates = [];

    existingLeaves.forEach(leave => {
      // Skip rejected or cancelled leaves
      if (leave.status === 'rejected' || leave.status === 'cancelled') {
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
      showError('This date already has a leave application. Please select a different date.');
      return; // Don't update if date is blocked
    }

    if (field === 'startDate') {
      setFormData({
        ...formData,
        startDate: value,
        endDate: value > formData.endDate ? value : formData.endDate
      });
    } else {
      setFormData({ ...formData, endDate: value });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'emergencyContact') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateDaysRequested = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.type || !formData.startDate || !formData.endDate || !formData.reason) {
      showError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      showError('End date cannot be before start date');
      return;
    }

    const daysRequested = calculateDaysRequested();

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        daysRequested
      };

      const response = await leaveService.applyLeave(submitData);

      if (response.success) {
        showSuccess('Leave application submitted successfully!');
        // Reset form
        setFormData({
          type: '',
          startDate: '',
          endDate: '',
          reason: '',
          emergencyContact: '',
          location: ''
        });
        // Navigate back to my leaves page after a short delay
        setTimeout(() => {
          navigate('/employee/leaves');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting leave application:', error);
      showError(error.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/employee/leaves')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to My Leaves
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Apply for Leave</h1>
            <p className="text-gray-600">Submit your leave application with all required details</p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {leaveTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 ${type.color} rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2`}>
                            {type.icon}
                          </div>
                          <div className="text-sm font-medium text-gray-700">{type.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                      {getBlockedDates().length > 0 && (
                        <span className="text-xs text-red-500 ml-2">
                          (Some dates unavailable due to existing leaves)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 transition-all duration-200 ${
                          isDateBlocked(formData.startDate)
                            ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                        }`}
                        required
                      />
                    </div>
                    {isDateBlocked(formData.startDate) && (
                      <p className="text-xs text-red-500 mt-1">
                        This date has an existing leave application
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                      {getBlockedDates().length > 0 && (
                        <span className="text-xs text-red-500 ml-2">
                          (Some dates unavailable due to existing leaves)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 transition-all duration-200 ${
                          isDateBlocked(formData.endDate)
                            ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                        }`}
                        required
                      />
                    </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Leave <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Please provide a detailed reason for your leave request..."
                      required
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact (Optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Emergency contact person and phone number"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location During Leave (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Where you will be during your leave"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/employee/leaves')}
                    className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                      submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;