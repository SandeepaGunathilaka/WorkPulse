import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  TrendingUp,
  UserCheck,
  FileText,
  CalendarDays,
  BarChart3,
  PieChart,
  Activity,
  Moon,
  Sun,
  Timer,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const AttendanceRecords = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredAttendanceData, setFilteredAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for charts - realistic for 30-50 employees
  const generateMockData = () => {
    const departments = ['Cardiology', 'Neurology', 'Emergency', 'Pediatrics', 'Surgery', 'Radiology'];
    const statuses = ['present', 'absent', 'late'];
    const shifts = ['day', 'night'];
    
    // Generate 35-45 employees total
    const totalEmployees = Math.floor(Math.random() * 16) + 35; // 35-50 employees
    const employees = [];
    
    // Create employee profiles
    for (let i = 1; i <= totalEmployees; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const shift = shifts[Math.floor(Math.random() * shifts.length)];
      
      employees.push({
        id: `emp_${i}`,
        employeeId: `EMP${String(i).padStart(3, '0')}`,
        name: `Employee ${i}`,
        department: dept,
        shift: shift
      });
    }
    
    const mockData = [];
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Generate attendance records for each day
    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      
      // Each employee has one record per day
      employees.forEach((employee, index) => {
        let status;
        
        // For today, ensure exactly 2 employees are present
        if (dateStr === today) {
          if (index < 2) {
            status = 'present';
          } else {
            // Randomly assign absent or late for the rest
            status = Math.random() > 0.5 ? 'absent' : 'late';
          }
        } else {
          // For other days, use random status
          status = statuses[Math.floor(Math.random() * statuses.length)];
        }
        
        mockData.push({
          id: `mock_${dateStr}_${employee.id}`,
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department,
          clockIn: status === 'absent' ? '-' : `${String(Math.floor(Math.random() * 3) + 7).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          clockOut: status === 'absent' ? '-' : `${String(Math.floor(Math.random() * 3) + 16).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          workingHours: status === 'absent' ? '0' : (Math.random() * 4 + 6).toFixed(1),
          overtime: Math.random() > 0.7 ? (Math.random() * 2).toFixed(1) : '0',
          status: status,
          shift: employee.shift,
          date: dateStr
        });
      });
    }
    
    return mockData;
  };

  // Use mock data instead of API calls
  useEffect(() => {
    const mockData = generateMockData();
    setAttendanceData(mockData);
    setLoading(false);
    setError(null);
  }, [startDate, endDate]);

  // Refresh function - now uses mock data
  const refreshData = async () => {
    setLoading(true);
    const mockData = generateMockData();
    setAttendanceData(mockData);
    setLoading(false);
    setError(null);
  };

  // Filter attendance data based on date range only
  useEffect(() => {
    const filtered = filterByDateRange(attendanceData, startDate, endDate);
    setFilteredAttendanceData(filtered);
  }, [attendanceData, startDate, endDate]);

  // Calculate dynamic stats based on filtered data
  const attendanceStats = {
    totalRecords: filteredAttendanceData.length,
    present: filteredAttendanceData.filter(record => record.status === 'present').length,
    absent: filteredAttendanceData.filter(record => record.status === 'absent').length,
    late: filteredAttendanceData.filter(record => record.status === 'late').length,
    attendanceRate: filteredAttendanceData.length > 0 
      ? ((filteredAttendanceData.filter(record => record.status === 'present').length / filteredAttendanceData.length) * 100).toFixed(1)
      : 0
  };

  // Get unique departments for filter
  const departments = [...new Set(attendanceData.map(record => record.department))];

  // Analytics calculations
  const getAnalyticsData = () => {
    const filtered = filteredAttendanceData;
    
    // Department-wise attendance
    const departmentStats = {};
    filtered.forEach(record => {
      if (!departmentStats[record.department]) {
        departmentStats[record.department] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      departmentStats[record.department][record.status]++;
      departmentStats[record.department].total++;
    });

    // Shift-wise attendance
    const shiftStats = { day: { present: 0, absent: 0, late: 0, total: 0 }, night: { present: 0, absent: 0, late: 0, total: 0 } };
    filtered.forEach(record => {
      if (record.shift) {
        shiftStats[record.shift][record.status]++;
        shiftStats[record.shift].total++;
      }
    });

    // Daily trends
    const dailyTrends = {};
    filtered.forEach(record => {
      if (!dailyTrends[record.date]) {
        dailyTrends[record.date] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      dailyTrends[record.date][record.status]++;
      dailyTrends[record.date].total++;
    });

    return { departmentStats, shiftStats, dailyTrends };
  };

  const analyticsData = getAnalyticsData();

  // Chart data preparation
  const departmentChartData = Object.entries(analyticsData.departmentStats).map(([dept, stats]) => ({
    department: dept,
    present: stats.present,
    absent: stats.absent,
    late: stats.late,
    attendanceRate: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0
  }));

  const shiftChartData = [
    {
      shift: 'Day Shift',
      present: analyticsData.shiftStats.day.present,
      absent: analyticsData.shiftStats.day.absent,
      late: analyticsData.shiftStats.day.late,
      attendanceRate: analyticsData.shiftStats.day.total > 0 ? 
        ((analyticsData.shiftStats.day.present / analyticsData.shiftStats.day.total) * 100).toFixed(1) : 0
    },
    {
      shift: 'Night Shift',
      present: analyticsData.shiftStats.night.present,
      absent: analyticsData.shiftStats.night.absent,
      late: analyticsData.shiftStats.night.late,
      attendanceRate: analyticsData.shiftStats.night.total > 0 ? 
        ((analyticsData.shiftStats.night.present / analyticsData.shiftStats.night.total) * 100).toFixed(1) : 0
    }
  ];

  const statusPieData = [
    { name: 'Present', value: attendanceStats.present, color: '#10B981' },
    { name: 'Absent', value: attendanceStats.absent, color: '#EF4444' },
    { name: 'Late', value: attendanceStats.late, color: '#F59E0B' }
  ];

  const dailyTrendData = Object.entries(analyticsData.dailyTrends)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, stats]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attendanceRate: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0,
      present: stats.present,
      absent: stats.absent,
      late: stats.late
    }));

  // Get unique departments for analytics (already declared above)

  const filterByDateRange = (data, start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return data.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  };

  const handleQuickDate = (days) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
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
                  Attendance Records & Analytics
                </h1>
                <p className="text-gray-600 mt-2">Comprehensive attendance analysis and reporting</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Refresh Button */}
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                {/* Date Range Picker */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Quick Date Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleQuickDate(0)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleQuickDate(1)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Last 2 Days
                  </button>
                  <button
                    onClick={() => handleQuickDate(6)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Last Week
                  </button>
                </div>

              </div>
            </div>

            {/* Analytics Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Analytics Summary - {startDate} to {endDate}
                </h2>
                <div className="text-sm text-gray-600">
                  Based on {filteredAttendanceData.length} records
                </div>
              </div>
              <p className="text-gray-600 mt-2">
                Comprehensive attendance analytics and insights for the selected period
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={refreshData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-700 font-semibold">Loading attendance records...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{attendanceStats.totalRecords}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Present</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">{attendanceStats.present}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Absent</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">{attendanceStats.absent}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Late</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">{attendanceStats.late}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Attendance Rate</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">{attendanceStats.attendanceRate}%</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Department-wise Attendance */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Department-wise Attendance
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10B981" name="Present" />
                      <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                      <Bar dataKey="late" fill="#F59E0B" name="Late" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Shift Comparison */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    Day vs Night Shift
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shiftChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="shift" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10B981" name="Present" />
                      <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                      <Bar dataKey="late" fill="#F59E0B" name="Late" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Status Distribution and Daily Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Status Distribution Pie Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-green-600" />
                    Status Distribution
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Attendance Trends */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Daily Attendance Trends
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="attendanceRate" stroke="#3B82F6" strokeWidth={2} name="Attendance Rate %" />
                      <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} name="Present" />
                      <Line type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} name="Late" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </>
        )}
      </div>

    </div>
  );
};

export default AttendanceRecords;