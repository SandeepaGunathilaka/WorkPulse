import api from './api';

// Get employee's upcoming schedules
export const getMySchedules = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/schedules/my-schedules?${queryString}`);
    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('Get my schedules error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch schedules',
      error: error.response?.data || error.message
    };
  }
};

// Get schedules for a specific date range (upcoming schedules)
export const getUpcomingSchedules = async (days = 7) => {
  try {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);

    const params = {
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 10
    };

    return await getMySchedules(params);
  } catch (error) {
    console.error('Get upcoming schedules error:', error);
    return {
      success: false,
      message: 'Failed to fetch upcoming schedules',
      error: error.message
    };
  }
};

// Request shift swap
export const requestShiftSwap = async (scheduleId, swapData) => {
  try {
    const response = await api.post(`/schedules/${scheduleId}/swap-request`, swapData);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Request shift swap error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to request shift swap',
      error: error.response?.data || error.message
    };
  }
};

// Get all schedules (admin function)
export const getAllSchedules = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/schedules?${queryString}`);
    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('Get all schedules error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch schedules',
      error: error.response?.data || error.message
    };
  }
};

// Get schedules by date range
export const getSchedulesByDateRange = async (startDate, endDate, params = {}) => {
  try {
    const queryParams = {
      ...params,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`/schedules?${queryString}`);
    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('Get schedules by date range error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch schedules',
      error: error.response?.data || error.message
    };
  }
};

// Get schedule statistics
export const getScheduleStats = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/schedules/stats?${queryString}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get schedule stats error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch schedule statistics',
      error: error.response?.data || error.message
    };
  }
};

// Create a new schedule
export const createSchedule = async (scheduleData) => {
  try {
    const response = await api.post('/schedules', scheduleData);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Create schedule error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create schedule',
      error: error.response?.data || error.message
    };
  }
};

// Update schedule
export const updateSchedule = async (scheduleId, scheduleData) => {
  try {
    const response = await api.put(`/schedules/${scheduleId}`, scheduleData);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Update schedule error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update schedule',
      error: error.response?.data || error.message
    };
  }
};

// Cancel schedule
export const cancelSchedule = async (scheduleId) => {
  try {
    const response = await api.delete(`/schedules/${scheduleId}`);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Cancel schedule error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to cancel schedule',
      error: error.response?.data || error.message
    };
  }
};

// Format schedule data for display
export const formatScheduleForDisplay = (schedule) => {
  const date = new Date(schedule.date);
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  // Format shift type
  const shiftTypeMap = {
    'morning': 'Morning Shift',
    'afternoon': 'Afternoon Shift',
    'night': 'Night Shift',
    'custom': 'Custom Shift'
  };

  // Format time
  const timeString = `${schedule.shift.startTime} - ${schedule.shift.endTime}`;

  // Status color mapping
  const statusColorMap = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'modified': 'bg-purple-100 text-purple-800'
  };

  return {
    date: date.toLocaleDateString('en-US', options),
    shift: shiftTypeMap[schedule.shift.type] || schedule.shift.type,
    time: timeString,
    status: schedule.status,
    statusColor: statusColorMap[schedule.status] || 'bg-gray-100 text-gray-800',
    department: schedule.department,
    location: schedule.location,
    notes: schedule.notes,
    id: schedule._id,
    isSwapRequest: schedule.isSwapRequest,
    swapRequestDetails: schedule.swapRequestDetails
  };
};