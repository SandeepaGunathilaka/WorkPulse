import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly

  // Mock data - Replace with actual API calls
  const attendanceData = [
    {
      id: 1,
      employeeId: 'EMP001',
      name: 'John Doe',
      department: 'Cardiology',
      clockIn: '08:00 AM',
      clockOut: '05:00 PM',
      status: 'present',
      workingHours: '9h 0m',
      overtime: '0h 0m'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: 'Sarah Wilson',
      department: 'Emergency',
      clockIn: '07:30 AM',
      clockOut: '06:15 PM',
      status: 'present',
      workingHours: '10h 45m',
      overtime: '1h 45m'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Mike Johnson',
      department: 'ICU',
      clockIn: '-',
      clockOut: '-',
      status: 'absent',
      workingHours: '0h 0m',
      overtime: '0h 0m'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      name: 'Emma Davis',
      department: 'Pediatrics',
      clockIn: '08:15 AM',
      clockOut: 'In Progress',
      status: 'present',
      workingHours: 'In Progress',
      overtime: '0h 0m'
    },
    {
      id: 5,
      employeeId: 'EMP005',
      name: 'David Brown',
      department: 'Surgery',
      clockIn: '09:30 AM',
      clockOut: '-',
      status: 'late',
      workingHours: 'In Progress',
      overtime: '0h 0m'
    }
  ];

  const attendanceStats = {
    totalEmployees: 156,
    present: 142,
    absent: 8,
    late: 6,
    attendanceRate: 91.0
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = attendanceData.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Attendance Management
                </h1>
                <p className="text-gray-600 mt-2">Monitor and manage employee attendance records</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['daily', 'weekly', 'monthly'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === mode
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{attendanceStats.totalEmployees}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
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

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, employee ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Daily Attendance - {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overtime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {record.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.name}</div>
                          <div className="text-sm text-gray-500">{record.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockIn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockOut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.workingHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.overtime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records Found</h3>
              <p className="text-gray-600">No attendance records match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;