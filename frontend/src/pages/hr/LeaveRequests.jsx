import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  FileText,
  Download
} from 'lucide-react';

const LeaveRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data - Replace with actual API calls
  const leaveRequests = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'Cardiology',
      leaveType: 'Annual Leave',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      days: 3,
      reason: 'Family vacation',
      status: 'pending',
      appliedDate: '2024-01-01',
      approver: null
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Sarah Wilson',
      department: 'Emergency',
      leaveType: 'Sick Leave',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      days: 3,
      reason: 'Medical treatment',
      status: 'approved',
      appliedDate: '2024-01-08',
      approver: 'Dr. Smith',
      approvedDate: '2024-01-09'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Mike Johnson',
      department: 'ICU',
      leaveType: 'Emergency Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-20',
      days: 1,
      reason: 'Family emergency',
      status: 'rejected',
      appliedDate: '2024-01-18',
      approver: 'Dr. Brown',
      rejectedDate: '2024-01-19',
      rejectionReason: 'Insufficient staff coverage'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      employeeName: 'Emma Davis',
      department: 'Pediatrics',
      leaveType: 'Maternity Leave',
      startDate: '2024-02-01',
      endDate: '2024-05-01',
      days: 90,
      reason: 'Maternity leave',
      status: 'approved',
      appliedDate: '2024-01-05',
      approver: 'HR Manager',
      approvedDate: '2024-01-06'
    }
  ];

  const leaveStats = {
    totalRequests: 24,
    pending: 8,
    approved: 14,
    rejected: 2
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'annual leave':
        return 'bg-blue-100 text-blue-800';
      case 'sick leave':
        return 'bg-red-100 text-red-800';
      case 'emergency leave':
        return 'bg-orange-100 text-orange-800';
      case 'maternity leave':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = (requestId) => {
    // Implement approval logic
    console.log('Approving request:', requestId);
  };

  const handleReject = (requestId) => {
    // Implement rejection logic
    console.log('Rejecting request:', requestId);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesType = filterType === 'all' || request.leaveType.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesStatus && matchesType;
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
                  Leave Requests
                </h1>
                <p className="text-gray-600 mt-2">Review and manage employee leave applications</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Bulk Approve
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{leaveStats.totalRequests}</p>
                <p className="text-sm text-blue-600 mt-1">This Month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{leaveStats.pending}</p>
                <p className="text-sm text-yellow-600 mt-1">Awaiting Review</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{leaveStats.approved}</p>
                <p className="text-sm text-green-600 mt-1">Approved</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{leaveStats.rejected}</p>
                <p className="text-sm text-red-600 mt-1">Declined</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="maternity">Maternity Leave</option>
            </select>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Leave Requests</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {request.employeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                          <div className="text-sm text-gray-500">{request.employeeId} • {request.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                        {request.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{request.days} day{request.days > 1 ? 's' : ''}</div>
                        <div className="text-gray-500">{request.startDate} to {request.endDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.appliedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests Found</h3>
              <p className="text-gray-600">No leave requests match your current filters.</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Leave Request Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Employee Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedRequest.employeeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{selectedRequest.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{selectedRequest.department}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Leave Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Leave Type:</span>
                        <span className="font-medium">{selectedRequest.leaveType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">{selectedRequest.startDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date:</span>
                        <span className="font-medium">{selectedRequest.endDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedRequest.days} day{selectedRequest.days > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Reason</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.reason}
                  </p>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Status Information</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(selectedRequest.status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </div>
                  {selectedRequest.approver && (
                    <p className="text-sm text-gray-600">
                      {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} by: {selectedRequest.approver}
                    </p>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div className="mt-3">
                      <h5 className="font-medium text-gray-900 mb-1">Rejection Reason:</h5>
                      <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg">
                        {selectedRequest.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;