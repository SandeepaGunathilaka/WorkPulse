import React from 'react';

const SimpleTest = () => {
  console.log('🎯 SimpleTest component rendered!');

  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#f0f9ff',
      minHeight: '100vh',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#22c55e',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        🎉 SUCCESS! Leave Management Route is Working! 🎉
      </div>

      <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>
        🏥 Admin Leave Management System
      </h1>

      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        This confirms that the /admin/leaves route is properly configured and working.
      </p>

      <div style={{
        backgroundColor: '#e5e7eb',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <strong>Route Details:</strong><br/>
        • URL: /admin/leaves<br/>
        • Component: SimpleTest<br/>
        • Status: ✅ Working
      </div>

      <button
        onClick={() => window.location.href = '/admin'}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ← Back to Admin Dashboard
      </button>
    </div>
  );
};

export default SimpleTest;