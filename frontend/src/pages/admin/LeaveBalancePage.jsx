import React from 'react';
import { Users, TrendingUp, Calendar } from 'lucide-react';

const LeaveBalancePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Leave Balance Management</h1>
          <p className="text-gray-600">Manage and track employee leave balances</p>
        </div>

        {/* Content */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Leave Balances</h3>
          <p className="text-gray-500">View and manage leave balances for all employees</p>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalancePage;