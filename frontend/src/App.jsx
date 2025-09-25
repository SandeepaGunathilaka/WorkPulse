import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';
import { ToastProvider } from './contexts/ToastContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeePortal from './pages/employee/EmployeePortal';
import HRPortal from './pages/hr/HRPortal';
import AdminPortal from './pages/admin/AdminPortal';

// Protected Route Component
import ProtectedRoute from './components/common/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          <ToastProvider>
            <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path="/employee/*" element={
                <ProtectedRoute requiredRoles={['employee', 'hr', 'manager', 'admin']}>
                  <EmployeePortal />
                </ProtectedRoute>
              } />

              <Route path="/hr/*" element={
                <ProtectedRoute requiredRoles={['hr', 'admin']}>
                  <HRPortal />
                </ProtectedRoute>
              } />

              <Route path="/admin/*" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminPortal />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            </Router>
          </ToastProvider>
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App
