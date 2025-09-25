import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';

const TestAdminPortal = () => {
  console.log('🔥🔥🔥 TestAdminPortal Component Rendered!');

  const location = useLocation();

  console.log('🔥 TestAdminPortal Loaded');
  console.log('🔥 Current location:', location.pathname);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Admin Portal</h1>
      <p>Current path: {location.pathname}</p>

      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ marginRight: '10px' }}>Dashboard</Link>
        <Link to="/admin/leaves" style={{ marginRight: '10px' }}>Leaves</Link>
        <Link to="/admin/leaves/policies" style={{ marginRight: '10px' }}>Policies</Link>
      </div>

      <div style={{ border: '2px solid blue', padding: '20px', minHeight: '200px' }}>
        <Routes>
          <Route index element={<div>TEST: Admin Dashboard Index</div>} />
          <Route path="leaves" element={<div>TEST: Leave Management</div>} />
          <Route path="leaves/policies" element={<div>TEST: Leave Policies</div>} />
          <Route path="*" element={<div>TEST: Not Found - Path: {location.pathname}</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default TestAdminPortal;