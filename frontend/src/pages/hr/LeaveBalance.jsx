import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Minus,
  BarChart3
} from 'lucide-react';

const LeaveBalance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data - Replace with actual API calls
  const leaveBalances = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'Cardiology',
      position: 'Senior Doctor',
      annualLeave: { total: 25, used: 8, remaining: 17 },
      sickLeave: { total: 12, used: 3, remaining: 9 },
      emergencyLeave: { total: 5, used: 1, remaining: 4 },
      maternityLeave: { total: 90, used: 0, remaining: 90 }
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Sarah Wilson',
      department: 'Emergency',
      position: 'Head Nurse',
      annualLeave: { total: 22, used: 12, remaining: 10 },
      sickLeave: { total: 12, used: 5, remaining: 7 },
      emergencyLeave: { total: 5, used: 2, remaining: 3 },
      maternityLeave: { total: 90, used: 0, remaining: 90 }
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Mike Johnson',
      department: 'ICU',
      position: 'Doctor',
      annualLeave: { total: 20, used: 15, remaining: 5 },
      sickLeave: { total: 12, used: 8, remaining: 4 },
      emergencyLeave: { total: 5, used: 3, remaining: 2 },
      maternityLeave: { total: 0, used: 0, remaining: 0 }
    },
    {
      id: 4,
      employeeId: 'EMP004',
      employeeName: 'Emma Davis',
      department: 'Pediatrics',
      position: 'Nurse',
      annualLeave: { total: 18, used: 6, remaining: 12 },
      sickLeave: { total: 12, used: 2, remaining: 10 },
      emergencyLeave: { total: 5, used: 0, remaining: 5 },
      maternityLeave: { total: 90, used: 45, remaining: 45 }
    }
  ];

  const departments = ['Cardiology', 'Emergency', 'ICU', 'Pediatrics', 'Surgery'];

  const getUsagePercentage = (used, total) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const filteredBalances = leaveBalances.filter(balance => {
    const matchesSearch = balance.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         balance.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         balance.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || balance.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Calculate overall statistics
  const totalEmployees = leaveBalances.length;
  const totalAnnualLeave = leaveBalances.reduce((sum, emp) => sum + emp.annualLeave.total, 0);
  const usedAnnualLeave = leaveBalances.reduce((sum, emp) => sum + emp.annualLeave.used, 0);
  const avgUsageRate = totalAnnualLeave > 0 ? Math.round((usedAnnualLeave / totalAnnualLeave) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Leave Balance Management
                </h1>
                <p className="text-gray-600 mt-2">Monitor and manage employee leave balances</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Leave Credits
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
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{totalEmployees}</p>
                <p className="text-sm text-blue-600 mt-1">Active Staff</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Leave Days</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{totalAnnualLeave}</p>
                <p className="text-sm text-green-600 mt-1">Annual Allocation</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Days Used</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{usedAnnualLeave}</p>
                <p className="text-sm text-orange-600 mt-1">This Year</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Usage Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{avgUsageRate}%</p>
                <p className="text-sm text-purple-600 mt-1">Average</p>
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
                placeholder="Search by name, employee ID, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Leave Balance Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Employee Leave Balances</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annual Leave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sick Leave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emergency Leave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maternity Leave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBalances.map((balance) => (
                  <tr key={balance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {balance.employeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{balance.employeeName}</div>
                          <div className="text-sm text-gray-500">{balance.employeeId} • {balance.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{balance.annualLeave.remaining}/{balance.annualLeave.total}</span>
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(balance.annualLeave.used, balance.annualLeave.total))}`}
                            style={{ width: `${getUsagePercentage(balance.annualLeave.used, balance.annualLeave.total)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{balance.sickLeave.remaining}/{balance.sickLeave.total}</span>
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(balance.sickLeave.used, balance.sickLeave.total))}`}
                            style={{ width: `${getUsagePercentage(balance.sickLeave.used, balance.sickLeave.total)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{balance.emergencyLeave.remaining}/{balance.emergencyLeave.total}</span>
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(balance.emergencyLeave.used, balance.emergencyLeave.total))}`}
                            style={{ width: `${getUsagePercentage(balance.emergencyLeave.used, balance.emergencyLeave.total)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {balance.maternityLeave.total > 0 ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{balance.maternityLeave.remaining}/{balance.maternityLeave.total}</span>
                              <span className="text-xs text-gray-500">days</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(balance.maternityLeave.used, balance.maternityLeave.total))}`}
                                style={{ width: `${getUsagePercentage(balance.maternityLeave.used, balance.maternityLeave.total)}%` }}
                              ></div>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(balance)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 flex items-center gap-1">
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                        <button className="text-red-600 hover:text-red-900 flex items-center gap-1">
                          <Minus className="w-4 h-4" />
                          Deduct
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBalances.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
              <p className="text-gray-600">No employees match your current filters.</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Leave Balance Details - {selectedEmployee.employeeName}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <button className="w-6 h-6">×</button>
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Employee Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{selectedEmployee.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{selectedEmployee.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Position:</span>
                        <span className="font-medium">{selectedEmployee.position}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Leave Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Annual Days:</span>
                        <span className="font-medium">{selectedEmployee.annualLeave.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Days Used:</span>
                        <span className="font-medium">{selectedEmployee.annualLeave.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Days Remaining:</span>
                        <span className="font-medium text-green-600">{selectedEmployee.annualLeave.remaining}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Annual Leave */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-3">Annual Leave</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-medium">{selectedEmployee.annualLeave.total} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Used:</span>
                        <span className="font-medium">{selectedEmployee.annualLeave.used} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining:</span>
                        <span className="font-medium text-green-600">{selectedEmployee.annualLeave.remaining} days</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 mt-2">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${getUsagePercentage(selectedEmployee.annualLeave.used, selectedEmployee.annualLeave.total)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Sick Leave */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-3">Sick Leave</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-medium">{selectedEmployee.sickLeave.total} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Used:</span>
                        <span className="font-medium">{selectedEmployee.sickLeave.used} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining:</span>
                        <span className="font-medium text-green-600">{selectedEmployee.sickLeave.remaining} days</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-3 mt-2">
                        <div
                          className="bg-red-600 h-3 rounded-full"
                          style={{ width: `${getUsagePercentage(selectedEmployee.sickLeave.used, selectedEmployee.sickLeave.total)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Leave */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h5 className="font-medium text-orange-900 mb-3">Emergency Leave</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-medium">{selectedEmployee.emergencyLeave.total} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Used:</span>
                        <span className="font-medium">{selectedEmployee.emergencyLeave.used} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining:</span>
                        <span className="font-medium text-green-600">{selectedEmployee.emergencyLeave.remaining} days</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-3 mt-2">
                        <div
                          className="bg-orange-600 h-3 rounded-full"
                          style={{ width: `${getUsagePercentage(selectedEmployee.emergencyLeave.used, selectedEmployee.emergencyLeave.total)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Maternity Leave */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-3">Maternity Leave</h5>
                    {selectedEmployee.maternityLeave.total > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total:</span>
                          <span className="font-medium">{selectedEmployee.maternityLeave.total} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Used:</span>
                          <span className="font-medium">{selectedEmployee.maternityLeave.used} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining:</span>
                          <span className="font-medium text-green-600">{selectedEmployee.maternityLeave.remaining} days</span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-3 mt-2">
                          <div
                            className="bg-purple-600 h-3 rounded-full"
                            style={{ width: `${getUsagePercentage(selectedEmployee.maternityLeave.used, selectedEmployee.maternityLeave.total)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not applicable for this employee</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Credits
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    View History
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalance;