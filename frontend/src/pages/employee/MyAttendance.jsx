import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, Coffee, Play, Pause, BarChart3, MapPin, User, Timer } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import attendanceService from '../../services/attendanceService';

const MyAttendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { showToast } = useToast();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance on component mount
  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
  }, []);

  // Refetch when month/year changes
  useEffect(() => {
    fetchAttendanceHistory();
  }, [selectedMonth, selectedYear]);

  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance();
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      // Set mock data for now until backend is ready
      setTodayAttendance(null);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const response = await attendanceService.getMyAttendance({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 50
      });

      setAttendanceHistory(response.data);
      setAttendanceSummary(response.summary);
    } catch (error) {
      console.error('Failed to load attendance history:', error);
      // Set mock data for now until backend is ready
      setAttendanceHistory([]);
      setAttendanceSummary({
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        totalHours: 0,
        totalOvertime: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const locationData = await getCurrentLocation();

      const response = await attendanceService.clockIn({
        location: locationData,
        method: 'web'
      });

      if (showToast) {
        showToast('Successfully clocked in!', 'success');
      }
      fetchTodayAttendance();
    } catch (error) {
      console.error('Clock in error:', error);
      // Mock successful clock in for demo
      setTodayAttendance({
        checkIn: { time: new Date().toISOString() },
        checkOut: null,
        breaks: [],
        isOnBreak: false
      });

      if (showToast) {
        showToast('Successfully clocked in! (Demo mode)', 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      const locationData = await getCurrentLocation();

      const response = await attendanceService.clockOut({
        location: locationData,
        method: 'web'
      });

      if (showToast) {
        showToast('Successfully clocked out!', 'success');
      }
      fetchTodayAttendance();
    } catch (error) {
      console.error('Clock out error:', error);
      // Mock successful clock out for demo
      setTodayAttendance(prev => ({
        ...prev,
        checkOut: { time: new Date().toISOString() },
        isOnBreak: false
      }));

      if (showToast) {
        showToast('Successfully clocked out! (Demo mode)', 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async (type = 'other') => {
    try {
      setLoading(true);
      const response = await attendanceService.startBreak({ type });
      if (showToast) {
        showToast('Break started!', 'success');
      }
      fetchTodayAttendance();
    } catch (error) {
      console.error('Start break error:', error);
      if (showToast) {
        showToast(error.message || 'Failed to start break', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.endBreak();
      if (showToast) {
        showToast('Break ended!', 'success');
      }
      fetchTodayAttendance();
    } catch (error) {
      console.error('End break error:', error);
      if (showToast) {
        showToast(error.message || 'Failed to end break', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
          resolve({ latitude: null, longitude: null });
        },
        { timeout: 10000 }
      );
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatWorkHours = (value) => {
    // Handle null, undefined, 0, or empty values
    if (!value || value === 0 || isNaN(value)) return '0h 0.00';

    // Convert to number if it's a string
    let numValue = typeof value === 'string' ? parseFloat(value) : value;

    // If still not a valid number, return default
    if (isNaN(numValue)) return '0h 0.00';

    // Always assume the value is in minutes
    const totalMinutes = numValue;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Return hours and minutes with 2 decimal places for minutes
    return `${hours}h ${minutes.toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'half-day':
        return 'bg-blue-100 text-blue-800';
      case 'on-leave':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentStatus = () => {
    if (!todayAttendance) return 'Not Started';
    if (todayAttendance.isOnBreak) return 'On Break';
    if (todayAttendance.checkIn?.time && !todayAttendance.checkOut?.time) return 'Working';
    if (todayAttendance.checkOut?.time) return 'Day Completed';
    return 'Not Started';
  };

  const getWorkDuration = () => {
    if (!todayAttendance?.checkIn?.time) return '0h 0.00';

    const startTime = new Date(todayAttendance.checkIn.time);
    const endTime = todayAttendance.checkOut?.time ?
      new Date(todayAttendance.checkOut.time) :
      new Date();

    let totalMinutes = Math.floor((endTime - startTime) / (1000 * 60));

    // Subtract break time
    if (todayAttendance.breaks?.length > 0) {
      const breakMinutes = todayAttendance.breaks.reduce((total, breakItem) => {
        if (breakItem.endTime && breakItem.startTime) {
          const breakDuration = Math.floor(
            (new Date(breakItem.endTime) - new Date(breakItem.startTime)) / (1000 * 60)
          );
          return total + breakDuration;
        }
        return total;
      }, 0);
      totalMinutes -= breakMinutes;
    }

    return formatWorkHours(totalMinutes);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2023, 2022];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-600 mt-2">Track your daily attendance and work hours</p>
      </div>

      {/* Current Time & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Time</p>
              <p className="text-2xl font-bold">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-100" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Today's Status</p>
              <p className="text-xl font-bold">{getCurrentStatus()}</p>
            </div>
            <User className="w-8 h-8 text-green-100" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Work Duration</p>
              <p className="text-xl font-bold">{getWorkDuration()}</p>
            </div>
            <Timer className="w-8 h-8 text-purple-100" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Monthly Hours</p>
              <p className="text-xl font-bold">
                {formatWorkHours(attendanceSummary?.totalHours || 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-100" />
          </div>
        </div>
      </div>

      {/* Today's Attendance Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Today's Attendance
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Check In</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(todayAttendance?.checkIn?.time)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Check Out</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(todayAttendance?.checkOut?.time)}
                </p>
              </div>
            </div>

            {/* Break Information */}
            {todayAttendance?.breaks && todayAttendance.breaks.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-700 mb-2">Break History</p>
                <div className="space-y-2">
                  {todayAttendance.breaks.map((breakItem, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-orange-600 capitalize">{breakItem.type} Break</span>
                      <span className="text-orange-800">
                        {formatTime(breakItem.startTime)} - {breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'}
                        {breakItem.duration && ` (${breakItem.duration}m)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-center space-y-4">
            {!todayAttendance?.checkIn?.time ? (
              <button
                onClick={handleClockIn}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{loading ? 'Clocking In...' : 'Clock In'}</span>
              </button>
            ) : !todayAttendance?.checkOut?.time ? (
              <div className="space-y-3">
                {todayAttendance?.isOnBreak ? (
                  <button
                    onClick={handleEndBreak}
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    <span>{loading ? 'Ending Break...' : 'End Break'}</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStartBreak('lunch')}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Lunch</span>
                    </button>
                    <button
                      onClick={() => handleStartBreak('tea')}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Tea</span>
                    </button>
                  </div>
                )}
                <button
                  onClick={handleClockOut}
                  disabled={loading || todayAttendance?.isOnBreak}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" />
                  <span>{loading ? 'Clocking Out...' : 'Clock Out'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-green-100 text-green-800 py-4 px-6 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Day Completed!</p>
                  <p className="text-sm">Have a great rest of your day</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      {attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceSummary.totalDays || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-2xl font-bold text-green-600">{attendanceSummary.presentDays || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.lateDays || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overtime</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatWorkHours(attendanceSummary.totalOvertime || 0)}
                </p>
              </div>
              <Timer className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0">Attendance History</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading attendance history...</p>
          </div>
        ) : attendanceHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Work Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceHistory.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.checkIn?.time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.checkOut?.time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.workHours ? formatWorkHours(record.workHours) : '0h 0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No attendance records found for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAttendance;