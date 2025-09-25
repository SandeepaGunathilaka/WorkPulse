import React, { useState, useEffect } from 'react';
import {
  Calculator, Users, Calendar, DollarSign, FileText,
  Search, Plus, Edit2, Trash2, Check, X, Download,
  Eye, AlertCircle, TrendingUp, Clock, Building2,
  CreditCard, Banknote, Wallet, Award, Filter
} from 'lucide-react';
import { salaryService } from '../../services/salaryService';
import { employeeService } from '../../services/employeeService';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/currencyFormatter';

const SalaryManagement = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'records'
  const [employees, setEmployees] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentSalary, setCurrentSalary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Generate Salary Form State
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentMonth = new Date().getMonth();
    return months[currentMonth];
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calculatedData, setCalculatedData] = useState(null);
  const [manualData, setManualData] = useState({
    salaryAdvance: 0,
    bonus: 0,
    reimbursements: 0,
    apit: 0
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Function to calculate allowances total if not provided by backend
  const calculateAllowancesTotal = (allowances) => {
    if (!allowances) return 0;

    const total = (allowances.costOfLiving || 0) +
                  (allowances.food || 0) +
                  (allowances.conveyance || 0) +
                  (allowances.medical || 0);

    return total;
  };

  // Function to ensure salary data has calculated totals
  const processSalaryData = (data) => {
    if (!data) return data;

    // Calculate allowances total if not provided or if it's 0
    if (data.allowances && (!data.allowances.total || data.allowances.total === 0)) {
      data.allowances.total = calculateAllowancesTotal(data.allowances);
    }

    return data;
  };

  // Handler for manual input fields with better UX and decimal support
  const handleManualInputChange = (field, value) => {
        setManualData(prev => ({
          ...prev,
          [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
        }));
      };

  // Handler for input focus - select all text when focused (especially useful for 0 values)
  const handleInputFocus = (e) => {
    // Select all text when focusing on the input, making it easy to replace
    e.target.select();
  };

  useEffect(() => {
    fetchEmployees();
    fetchSalaryRecords();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAllEmployees({ limit: 100 });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalaryRecords = async () => {
    try {
      const response = await salaryService.getAllSalaries({ limit: 50 });
      const processedRecords = (response.data || []).map(record => processSalaryData(record));
      setSalaryRecords(processedRecords);
    } catch (error) {
      console.error('Error fetching salary records:', error);
    }
  };

  const handleCalculateSalary = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) {
      showError('Please select employee, month, and year');
      return;
    }

    try {
      setLoading(true);
      const response = await salaryService.calculateSalary(selectedEmployee, selectedMonth, selectedYear);
      const processedData = processSalaryData(response.data);
      setCalculatedData(processedData);
      showSuccess('Salary calculated successfully!');
    } catch (error) {
      console.error('Error calculating salary:', error);
      showError(error.message || 'Error calculating salary');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSalary = async () => {
    if (!calculatedData) return;

    try {
      setLoading(true);

      // Calculate total deductions
      const epfDeduction = Math.round(calculatedData.basicSalary * 0.08);
      const totalDeductions =
        epfDeduction +
        (calculatedData.deductions?.noPayDaysDeduction || 0) +
        manualData.salaryAdvance +
        manualData.apit;

      // Calculate gross salary
      const grossSalary =
        calculatedData.basicSalary +
        (calculatedData.allowances?.total || 0) +
        (calculatedData.additionalPerks?.overtime || 0) +
        manualData.bonus +
        manualData.reimbursements;

      // Calculate net payable salary
      const netPayableSalary = grossSalary - totalDeductions;

      const salaryData = {
        employee: selectedEmployee,
        month: selectedMonth,
        year: selectedYear,
        ...calculatedData,
        deductions: {
          ...calculatedData.deductions,
          salaryAdvance: manualData.salaryAdvance,
          apit: manualData.apit,
          epfEmployee: {
            percentage: 8,
            amount: epfDeduction
          },
          total: totalDeductions
        },
        additionalPerks: {
          ...calculatedData.additionalPerks,
          bonus: manualData.bonus,
          reimbursements: manualData.reimbursements
        },
        grossSalary: grossSalary,
        salaryBeforeDeduction: grossSalary,
        netPayableSalary: netPayableSalary,
        // Add EPF contributions for employer
        epfContributions: {
          employee: {
            percentage: 8,
            amount: epfDeduction
          },
          employer: {
            percentage: 12,
            amount: Math.round(calculatedData.basicSalary * 0.12)
          },
          etf: {
            percentage: 3,
            amount: Math.round(calculatedData.basicSalary * 0.03)
          }
        }
      };

      console.log('Sending salary data:', salaryData);
      await salaryService.createSalary(salaryData);
      showSuccess('Salary record saved successfully!');

      // Reset form
      setCalculatedData(null);
      setSelectedEmployee('');
      setSelectedMonth(months[new Date().getMonth()]); // Reset to current month
      setSelectedYear(new Date().getFullYear()); // Reset to current year
      setManualData({ salaryAdvance: 0, bonus: 0, reimbursements: 0, apit: 0 });

      // Refresh records
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error saving salary:', error);
      showError(error.message || 'Error saving salary record');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSalary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;

    try {
      await salaryService.deleteSalary(id);
      showSuccess('Salary record deleted successfully');
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error deleting salary:', error);
      showError(error.message || 'Error deleting salary record');
    }
  };

  const handleApproveSalary = async (id) => {
    try {
      await salaryService.approveSalary(id);
      showSuccess('Salary record approved successfully');
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error approving salary:', error);
      showError(error.message || 'Error approving salary record');
    }
  };

  const handleDownloadPayslip = async (salary) => {
    try {
      setLoading(true);
      await salaryService.generatePayslipPDF(salary);
      showSuccess('Payslip downloaded successfully!');
    } catch (error) {
      console.error('Error generating payslip:', error);
      showError('Error generating payslip PDF');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredSalaryRecords = salaryRecords.filter(record => {
    const matchesSearch = record.employeeInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeInfo?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Salary Management
            </h1>
            <p className="text-gray-600 mt-1">Generate monthly salary reports and manage payroll</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-xl font-bold">{salaryRecords.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'generate'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calculator className="w-4 h-4 inline mr-2" />
            Generate Salary
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'records'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Salary Records
          </button>
        </div>
      </div>

      {/* Generate Salary Tab */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selection Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Generate Monthly Salary</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Employee *</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                  required
                >
                  <option value="">Choose Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Month * (Current Month Only)</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-xl border-gray-300 shadow-sm bg-gray-50 text-gray-700 p-3 cursor-not-allowed"
                    required
                    disabled
                  >
                    <option value={selectedMonth}>{selectedMonth}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only current month ({selectedMonth}) salary can be generated
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year * (Current Year Only)</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full rounded-xl border-gray-300 shadow-sm bg-gray-50 text-gray-700 p-3 cursor-not-allowed"
                    required
                    disabled
                  >
                    <option value={selectedYear}>{selectedYear}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only current year ({selectedYear}) salary can be generated
                  </p>
                </div>
              </div>

              <button
                onClick={handleCalculateSalary}
                disabled={loading || !selectedEmployee || !selectedMonth}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Calculating...
                  </div>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 inline mr-2" />
                    Generate Salary
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Calculated Data Display */}
          {calculatedData && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Salary Calculation Results</h3>

              <div className="space-y-6">
                {/* Employee Information */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Employee Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><strong>Name:</strong> {calculatedData.employeeInfo?.name}</div>
                    <div><strong>Employee ID:</strong> {calculatedData.employeeInfo?.employeeId}</div>
                    <div><strong>Designation:</strong> {calculatedData.employeeInfo?.designation}</div>
                    <div><strong>EPF No:</strong> {calculatedData.employeeInfo?.epfNo}</div>
                  </div>
                </div>

                {/* Attendance Details */}
                {calculatedData.attendance && (
                  <div className="bg-orange-50 rounded-xl p-4">
                    <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Attendance Details
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div><strong>Working Days:</strong> {calculatedData.attendance.workingDays}</div>
                      <div><strong>Leave Allowed:</strong> {calculatedData.attendance.leaveAllowed} days</div>
                      <div><strong>Leave Taken:</strong> {calculatedData.attendance.leaveTaken || 0} days</div>
                      <div><strong>Excess Leave:</strong> {calculatedData.attendance.excessLeaveDays || 0} days</div>
                      <div><strong>Overtime Hours:</strong> {calculatedData.attendance.overtimeHours || 0} hrs</div>
                      <div><strong>No Pay Days:</strong> {calculatedData.attendance.noPayLeave || 0} days</div>
                    </div>
                  </div>
                )}

                {/* Basic Salary & Allowances */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Basic Salary & Allowances
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div><strong>Basic Salary:</strong> {formatCurrency(calculatedData.basicSalary)}</div>
                    <div><strong>Cost of Living:</strong> {formatCurrency(calculatedData.allowances?.costOfLiving)}</div>
                    <div><strong>Food Allowance:</strong> {formatCurrency(calculatedData.allowances?.food)}</div>
                    <div><strong>Conveyance:</strong> {formatCurrency(calculatedData.allowances?.conveyance)}</div>
                    <div><strong>Medical:</strong> {formatCurrency(calculatedData.allowances?.medical)}</div>
                    <div className="font-bold text-blue-700"><strong>Total Allowances:</strong> {formatCurrency(calculatedData.allowances?.total)}</div>
                  </div>
                </div>

                {/* Additional Earnings */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Additional Earnings
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div><strong>Overtime Pay:</strong> {formatCurrency(calculatedData.additionalPerks?.overtime)}</div>
                    <div><strong>Reimbursements:</strong> {formatCurrency(calculatedData.additionalPerks?.reimbursements)}</div>
                    <div><strong>Bonus:</strong> {formatCurrency(calculatedData.additionalPerks?.bonus)}</div>
                  </div>
                </div>

                {/* EPF/ETF Contributions */}
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    EPF/ETF Contributions
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-indigo-700">Employee Contributions (Deductions):</div>
                      <div className="text-sm pl-4">
                        <div>EPF Employee (8%): {formatCurrency(Math.round(calculatedData.basicSalary * 0.08))}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-indigo-700">Employer Contributions (Company Pays):</div>
                      <div className="text-sm pl-4">
                        <div>EPF Employer (12%): {formatCurrency(Math.round(calculatedData.basicSalary * 0.12))}</div>
                        <div>ETF (3%): {formatCurrency(Math.round(calculatedData.basicSalary * 0.03))}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <div className="text-sm"><strong>Total Company Contribution:</strong> {formatCurrency(Math.round(calculatedData.basicSalary * 0.15))}</div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-red-50 rounded-xl p-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Deductions
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div><strong>EPF Employee (8%):</strong> {formatCurrency(Math.round(calculatedData.basicSalary * 0.08))}</div>
                    <div><strong>No Pay Deduction:</strong> {formatCurrency(calculatedData.deductions?.noPayDaysDeduction)}</div>
                    <div><strong>Salary Advance:</strong> {formatCurrency(calculatedData.deductions?.salaryAdvance)}</div>
                    <div><strong>APIT:</strong> {formatCurrency(calculatedData.deductions?.apit)}</div>
                  </div>
                </div>

                {/* Final Calculation */}
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-4 border-2 border-green-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Final Calculation Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-semibold text-green-700">EARNINGS:</div>
                      <div>Basic Salary: {formatCurrency(calculatedData.basicSalary)}</div>
                      <div>Allowances: {formatCurrency(calculatedData.allowances?.total)}</div>
                      <div>Overtime: {formatCurrency(calculatedData.additionalPerks?.overtime)}</div>
                      <div className="border-t pt-1 font-semibold">
                        Gross Salary: LKR {(
                          calculatedData.basicSalary +
                          (calculatedData.allowances?.total || 0) +
                          (calculatedData.additionalPerks?.overtime || 0)
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-red-700">DEDUCTIONS:</div>
                      <div>EPF (8%): {formatCurrency(Math.round(calculatedData.basicSalary * 0.08))}</div>
                      <div>No Pay: {formatCurrency(calculatedData.deductions?.noPayDaysDeduction)}</div>
                      <div>APIT: {formatCurrency(calculatedData.deductions?.apit)}</div>
                      <div className="border-t pt-1 font-semibold">
                        Total Deductions: LKR {(
                          Math.round(calculatedData.basicSalary * 0.08) +
                          (calculatedData.deductions?.noPayDaysDeduction || 0) +
                          (calculatedData.deductions?.apit || 0)
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-bold text-blue-700 text-lg">NET SALARY:</div>
                      <div className="text-2xl font-bold text-blue-600">
                        LKR {(
                          calculatedData.basicSalary +
                          (calculatedData.allowances?.total || 0) +
                          (calculatedData.additionalPerks?.overtime || 0) -
                          Math.round(calculatedData.basicSalary * 0.08) -
                          (calculatedData.deductions?.noPayDaysDeduction || 0) -
                          (calculatedData.deductions?.apit || 0)
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Updated Final Calculation with Manual Inputs */}
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-yellow-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Updated Final Calculation (Including Manual Entries)
                  </h4>
                  {(() => {
                    const epfDeduction = Math.round(calculatedData.basicSalary * 0.08);
                    const totalDeductions = epfDeduction +
                      (calculatedData.deductions?.noPayDaysDeduction || 0) +
                      manualData.salaryAdvance +
                      manualData.apit;
                    const grossSalary = calculatedData.basicSalary +
                      (calculatedData.allowances?.total || 0) +
                      (calculatedData.additionalPerks?.overtime || 0) +
                      manualData.bonus +
                      manualData.reimbursements;
                    const netSalary = grossSalary - totalDeductions;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="font-semibold text-green-700">UPDATED EARNINGS:</div>
                          <div>Basic: {formatCurrency(calculatedData.basicSalary)}</div>
                          <div>Allowances: {formatCurrency(calculatedData.allowances?.total || 0)}</div>
                          <div>Overtime: {formatCurrency(calculatedData.additionalPerks?.overtime || 0)}</div>
                          <div>Bonus: {formatCurrency(manualData.bonus)}</div>
                          <div>Reimbursements: {formatCurrency(manualData.reimbursements)}</div>
                          <div className="border-t pt-1 font-semibold text-green-800">
                            Gross: {formatCurrency(grossSalary)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold text-red-700">UPDATED DEDUCTIONS:</div>
                          <div>EPF (8%): {formatCurrency(epfDeduction)}</div>
                          <div>No Pay: {formatCurrency(calculatedData.deductions?.noPayDaysDeduction || 0)}</div>
                          <div>Salary Advance: {formatCurrency(manualData.salaryAdvance)}</div>
                          <div>APIT: {formatCurrency(manualData.apit)}</div>
                          <div className="border-t pt-1 font-semibold text-red-800">
                            Total: {formatCurrency(totalDeductions)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-bold text-blue-700 text-lg">FINAL NET SALARY:</div>
                          <div className="text-3xl font-bold text-blue-600">
                            {formatCurrency(netSalary)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {netSalary > 0 ? '✅ Ready to save' : '❌ Negative salary'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Manual input fields */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">!</span>
                    Manual Entry Required
                  </h4>
                  <p className="text-blue-700 text-sm mb-4">Enter additional amounts below. Leave as 0 if not applicable.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Salary Advance (Deduction)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">LKR</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max="99999.99"
                          value={manualData.salaryAdvance === 0 ? '' : manualData.salaryAdvance}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            // Allow empty input for better UX
                            if (value === '') {
                              handleManualInputChange('salaryAdvance', 0);
                              return;
                            }
                            
                            // Validate digit length (max 5 digits before decimal, 2 after)
                            const decimalParts = value.split('.');
                            const integerPart = decimalParts[0];
                            const decimalPart = decimalParts[1] || '';
                            
                            // Check if total digits exceed limit (5 integer + 2 decimal = 7 total)
                            if (integerPart.length > 5 || decimalPart.length > 2 || (integerPart.length + decimalPart.length) > 7) {
                              return; // Don't update if exceeds limits
                            }
                            
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 99999.99) {
                              handleManualInputChange('salaryAdvance', parseFloat(numValue.toFixed(2)));
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              handleManualInputChange('salaryAdvance', 0);
                            } else {
                              const numValue = parseFloat(e.target.value);
                              if (!isNaN(numValue)) {
                                handleManualInputChange('salaryAdvance', parseFloat(numValue.toFixed(2)));
                              }
                            }
                          }}
                          onFocus={handleInputFocus}
                          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Amount to deduct from salary</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Performance Bonus (Addition)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">LKR</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max="99999.99"
                          value={manualData.bonus === 0 ? '' : manualData.bonus}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            if (value === '') {
                              handleManualInputChange('bonus', 0);
                              return;
                            }
                            
                            // Validate digit length
                            const decimalParts = value.split('.');
                            const integerPart = decimalParts[0];
                            const decimalPart = decimalParts[1] || '';
                            
                            if (integerPart.length > 5 || decimalPart.length > 2 || (integerPart.length + decimalPart.length) > 7) {
                              return;
                            }
                            
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 99999.99) {
                              handleManualInputChange('bonus', parseFloat(numValue.toFixed(2)));
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              handleManualInputChange('bonus', 0);
                            } else {
                              const numValue = parseFloat(e.target.value);
                              if (!isNaN(numValue)) {
                                handleManualInputChange('bonus', parseFloat(numValue.toFixed(2)));
                              }
                            }
                          }}
                          onFocus={handleInputFocus}
                          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Additional bonus amount</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reimbursements (Addition)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">LKR</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max="99999.99"
                          value={manualData.reimbursements === 0 ? '' : manualData.reimbursements}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            if (value === '') {
                              handleManualInputChange('reimbursements', 0);
                              return;
                            }
                            
                            // Validate digit length
                            const decimalParts = value.split('.');
                            const integerPart = decimalParts[0];
                            const decimalPart = decimalParts[1] || '';
                            
                            if (integerPart.length > 5 || decimalPart.length > 2 || (integerPart.length + decimalPart.length) > 7) {
                              return;
                            }
                            
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 99999.99) {
                              handleManualInputChange('reimbursements', parseFloat(numValue.toFixed(2)));
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              handleManualInputChange('reimbursements', 0);
                            } else {
                              const numValue = parseFloat(e.target.value);
                              if (!isNaN(numValue)) {
                                handleManualInputChange('reimbursements', parseFloat(numValue.toFixed(2)));
                              }
                            }
                          }}
                          onFocus={handleInputFocus}
                          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Expense reimbursements</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        APIT Tax (Deduction)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">LKR</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max="99999.99"
                          value={manualData.apit === 0 ? '' : manualData.apit}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            if (value === '') {
                              handleManualInputChange('apit', 0);
                              return;
                            }
                            
                            // Validate digit length
                            const decimalParts = value.split('.');
                            const integerPart = decimalParts[0];
                            const decimalPart = decimalParts[1] || '';
                            
                            if (integerPart.length > 5 || decimalPart.length > 2 || (integerPart.length + decimalPart.length) > 7) {
                              return;
                            }
                            
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 99999.99) {
                              handleManualInputChange('apit', parseFloat(numValue.toFixed(2)));
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              handleManualInputChange('apit', 0);
                            } else {
                              const numValue = parseFloat(e.target.value);
                              if (!isNaN(numValue)) {
                                handleManualInputChange('apit', parseFloat(numValue.toFixed(2)));
                              }
                            }
                          }}
                          onFocus={handleInputFocus}
                          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Advanced Personal Income Tax</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">
                      💡 Tip: Values will automatically update the salary calculation above
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSaveSalary}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  Save Salary Record
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Salary Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{salaryRecords.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Draft</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {salaryRecords.filter(s => s.status === 'draft').length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Approved</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {salaryRecords.filter(s => s.status === 'approved').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {formatCurrency(salaryRecords.reduce((sum, s) => sum + (s.netPayableSalary || 0), 0))}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Salary Records</h3>
            </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Month/Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Basic Salary</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Net Salary</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSalaryRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      {searchTerm || filterStatus !== 'all' ? 'No matching salary records found' : 'No salary records found'}
                    </td>
                  </tr>
                ) : (
                  filteredSalaryRecords.map((salary) => (
                    <tr key={salary._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {salary.employee?.firstName} {salary.employee?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {salary.employee?.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {salary.month} {salary.year}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(salary.basicSalary)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(salary.netPayableSalary)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(salary.status)}`}>
                          {salary.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownloadPayslip(salary)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download Payslip"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {salary.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleApproveSalary(salary._id)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSalary(salary._id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 font-medium">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;