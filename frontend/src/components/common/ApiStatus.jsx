import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const ApiStatus = () => {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking API connection...');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await api.get('/health');
      if (response.data.status === 'OK') {
        setStatus('connected');
        setMessage('Backend connected successfully');
      } else {
        setStatus('error');
        setMessage('Backend responded with error');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to connect to backend');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{message}</span>
      {status === 'error' && (
        <button
          onClick={checkApiStatus}
          className="ml-2 text-xs underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ApiStatus;