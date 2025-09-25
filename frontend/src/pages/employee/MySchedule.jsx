import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, List, ChevronLeft, ChevronRight,
  Sun, Moon, Cloud, Coffee, Activity, Users, Building2,
  CalendarDays, TrendingUp, Award, Bell, AlertCircle,
  CheckCircle, XCircle, Loader2, RefreshCw
} from 'lucide-react';
import { getMySchedules, getUpcomingSchedules, requestShiftSwap, formatScheduleForDisplay } from '../../services/scheduleService';

const MySchedule = () => {
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' or 'list' or 'timeline'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upcomingShift, setUpcomingShift] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get shift icon based on type
  const getShiftIcon = (type) => {
    switch(type) {
      case 'morning': return <Sun className="w-5 h-5" />;
      case 'afternoon': return <Cloud className="w-5 h-5" />;
      case 'night': return <Moon className="w-5 h-5" />;
      default: return <Coffee className="w-5 h-5" />;
    }
  };

  // Get shift colors
  const getShiftColors = (type) => {
    switch(type) {
      case 'morning':
        return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
      case 'afternoon':
        return 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white';
      case 'night':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  // Generate calendar days for the selected month
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startCalendar);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Get schedule for a specific date
  const getScheduleForDate = (date) => {
    return schedules.find(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  // Navigate calendar
  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  // Fetch schedules
  useEffect(() => {
    fetchMySchedules();
  }, [selectedDate]);

  // Find upcoming shift
  useEffect(() => {
    const now = new Date();
    const upcoming = schedules
      .filter(s => new Date(s.date) >= now && s.status !== 'cancelled')
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    setUpcomingShift(upcoming);
  }, [schedules]);

  const fetchMySchedules = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      const response = await getMySchedules({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100
      });

      setSchedules(response.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMySchedules();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Calculate stats
  const calculateStats = () => {
    const currentMonthSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.getMonth() === selectedDate.getMonth() &&
             scheduleDate.getFullYear() === selectedDate.getFullYear() &&
             schedule.status !== 'cancelled';
    });

    const totalDays = currentMonthSchedules.length;
    const totalHours = currentMonthSchedules.reduce((sum, schedule) => {
      if (schedule.shift?.startTime && schedule.shift?.endTime) {
        const [startHour, startMin] = schedule.shift.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.shift.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;
        if (endMinutes < startMinutes) endMinutes += 24 * 60;
        const totalMinutes = endMinutes - startMinutes - (schedule.shift.breakDuration || 0);
        return sum + (totalMinutes / 60);
      }
      return sum;
    }, 0);

    const shiftTypes = currentMonthSchedules.reduce((acc, schedule) => {
      const type = schedule.shift?.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const departments = [...new Set(currentMonthSchedules.map(s => s.department))];
    const primaryDepartment = departments[0] || 'Not Assigned';

    return {
      totalDays,
      totalHours: totalHours.toFixed(1),
      primaryDepartment,
      shiftTypes
    };
  };

  const stats = calculateStats();

  // Format time difference
  const getTimeUntilShift = (shiftDate) => {
    const now = new Date();
    const shift = new Date(shiftDate);
    const diffMs = shift - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Today';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Schedule
            </h1>
            <p className="text-gray-600 mt-1">Manage your work shifts and calendar</p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Upcoming Shift Alert */}
      {upcomingShift && (
        <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Next Shift {getTimeUntilShift(upcomingShift.date)}</h3>
                  <p className="text-sm opacity-90">
                    {new Date(upcomingShift.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  {getShiftIcon(upcomingShift.shift?.type)}
                  <span className="font-semibold capitalize">{upcomingShift.shift?.type} Shift</span>
                </div>
                <p className="text-sm opacity-90">
                  {upcomingShift.shift?.startTime} - {upcomingShift.shift?.endTime}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {upcomingShift.department}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Shifts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDays}</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalHours}</p>
              <p className="text-xs text-gray-500 mt-1">Hours worked</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Department</p>
              <p className="text-lg font-bold text-gray-900">{stats.primaryDepartment}</p>
              <p className="text-xs text-gray-500 mt-1">Primary</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Shift Pattern</p>
              <div className="flex space-x-2 mt-2">
                {stats.shiftTypes.morning > 0 && (
                  <div className="flex items-center space-x-1">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold">{stats.shiftTypes.morning}</span>
                  </div>
                )}
                {stats.shiftTypes.afternoon > 0 && (
                  <div className="flex items-center space-x-1">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold">{stats.shiftTypes.afternoon}</span>
                  </div>
                )}
                {stats.shiftTypes.night > 0 && (
                  <div className="flex items-center space-x-1">
                    <Moon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold">{stats.shiftTypes.night}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Distribution</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('calendar')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                currentView === 'calendar'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                currentView === 'list'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4 inline mr-2" />
              List
            </button>
            <button
              onClick={() => setCurrentView('timeline')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                currentView === 'timeline'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Timeline
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {currentView === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const daySchedule = getScheduleForDate(day);
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const isPast = day < new Date() && !isToday;

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-3 rounded-xl transition-all duration-200 cursor-pointer
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' :
                      isToday ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300' :
                      isPast ? 'bg-gray-50' : 'bg-white border border-gray-200'}
                    ${daySchedule && isCurrentMonth ? 'hover:shadow-lg' : 'hover:bg-gray-100'}
                  `}
                  onClick={() => daySchedule && setSelectedSchedule(daySchedule)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-semibold text-sm ${isToday ? 'text-blue-600' : ''}`}>
                      {day.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {isCurrentMonth && daySchedule && (
                    <div className={`p-2 rounded-lg ${getShiftColors(daySchedule.shift?.type)} transform hover:scale-105 transition-transform`}>
                      <div className="flex items-center space-x-1 mb-1">
                        {getShiftIcon(daySchedule.shift?.type)}
                        <span className="text-xs font-semibold capitalize">
                          {daySchedule.shift?.type}
                        </span>
                      </div>
                      <div className="text-xs opacity-90">
                        {daySchedule.shift?.startTime} - {daySchedule.shift?.endTime}
                      </div>
                      {daySchedule.status === 'cancelled' && (
                        <div className="mt-1 text-xs bg-red-500 text-white px-2 py-1 rounded">
                          Cancelled
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {currentView === 'list' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Shift</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      No schedules found for this month
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => {
                    const scheduleDate = new Date(schedule.date);
                    const isToday = scheduleDate.toDateString() === new Date().toDateString();
                    const isPast = scheduleDate < new Date() && !isToday;

                    return (
                      <tr
                        key={schedule._id}
                        className={`hover:bg-gray-50 transition-colors ${isPast ? 'opacity-60' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {scheduleDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            {isToday && (
                              <span className="text-xs text-blue-600 font-semibold">Today</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${getShiftColors(schedule.shift?.type)}`}>
                            {getShiftIcon(schedule.shift?.type)}
                            <span className="font-semibold capitalize">
                              {schedule.shift?.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {schedule.shift?.startTime} - {schedule.shift?.endTime}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{schedule.department}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {schedule.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {schedule.location.building}
                                {schedule.location.floor && `, Floor ${schedule.location.floor}`}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold
                            ${schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                              schedule.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              schedule.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {schedule.status === 'scheduled' && <CheckCircle className="w-3 h-3" />}
                            {schedule.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                            {schedule.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                            {schedule.status === 'in-progress' && <AlertCircle className="w-3 h-3" />}
                            <span className="capitalize">{schedule.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {currentView === 'timeline' && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shift Timeline</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-600"></div>
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                No schedules found for this month
              </div>
            ) : (
              schedules.map((schedule, index) => {
                const scheduleDate = new Date(schedule.date);
                const isToday = scheduleDate.toDateString() === new Date().toDateString();
                const isFuture = scheduleDate > new Date();

                return (
                  <div key={schedule._id} className="relative flex items-start mb-8">
                    <div className={`absolute left-5 w-6 h-6 rounded-full border-4 border-white z-10
                      ${isFuture ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                        isToday ? 'bg-green-500 animate-pulse' :
                        'bg-gray-400'}
                    `}></div>

                    <div className="ml-16 flex-1">
                      <div className={`p-5 rounded-xl shadow-md border transition-all duration-200 hover:shadow-lg
                        ${isToday ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300' :
                          isFuture ? 'bg-white border-gray-200' :
                          'bg-gray-50 border-gray-200 opacity-75'}
                      `}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {scheduleDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                              </span>
                              {isToday && (
                                <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                  TODAY
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-4 mb-3">
                              <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${getShiftColors(schedule.shift?.type)}`}>
                                {getShiftIcon(schedule.shift?.type)}
                                <span className="font-semibold capitalize">
                                  {schedule.shift?.type} Shift
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {schedule.shift?.startTime} - {schedule.shift?.endTime}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-4 h-4" />
                                <span>{schedule.department}</span>
                              </div>
                              {schedule.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>
                                    {schedule.location.building}
                                    {schedule.location.floor && `, Floor ${schedule.location.floor}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                              schedule.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {schedule.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected Schedule Modal */}
      {selectedSchedule && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSchedule(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Schedule Details</h3>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold">
                    {new Date(selectedSchedule.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${selectedSchedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      selectedSchedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedSchedule.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'}
                  `}>
                    {selectedSchedule.status}
                  </span>
                </div>

                <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg mb-3 ${getShiftColors(selectedSchedule.shift?.type)}`}>
                  {getShiftIcon(selectedSchedule.shift?.type)}
                  <span className="font-semibold capitalize">
                    {selectedSchedule.shift?.type} Shift
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Time:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedSchedule.shift?.startTime} - {selectedSchedule.shift?.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Break:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedSchedule.shift?.breakDuration || 30} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedSchedule.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedSchedule.location ?
                        `${selectedSchedule.location.building}${selectedSchedule.location.floor ? `, Floor ${selectedSchedule.location.floor}` : ''}` :
                        'Not specified'
                      }
                    </p>
                  </div>
                </div>

                {selectedSchedule.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">Notes:</p>
                    <p className="text-gray-900">{selectedSchedule.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-gray-700 font-medium">Loading schedules...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySchedule;