import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';

// Import Employee Components
import EmployeeSidebar from '../../components/employee/EmployeeSidebar';
import EmployeeHeader from '../../components/employee/EmployeeHeader';

// Import Employee Pages
import EmployeeDashboard from './EmployeeDashboard';
import MyAttendance from './MyAttendance';
import AttendanceHistory from './AttendanceHistory';
import AttendanceReports from './AttendanceReports';
import MyLeave from './MyLeave';
import ApplyLeave from './ApplyLeave';
import MySchedule from './MySchedule';
import MySalary from './MySalary';
import MyProfile from './MyProfile';
import LeavePolicies from './LeavePolicies';

const EmployeePortal = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <EmployeeSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-[280px]">
        {/* Header */}
        <EmployeeHeader onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<EmployeeDashboard />} />
            <Route path="/attendance" element={<MyAttendance />} />
            <Route path="/attendance/history" element={<AttendanceHistory />} />
            <Route path="/attendance/reports" element={<AttendanceReports />} />
            <Route path="/leaves" element={<MyLeave />} />
            <Route path="/leaves/apply" element={<ApplyLeave />} />
            <Route path="/leaves/policies" element={<LeavePolicies />} />
            <Route path="/schedule" element={<MySchedule />} />
            <Route path="/salary" element={<MySalary />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/profile/edit" element={<MyProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default EmployeePortal;