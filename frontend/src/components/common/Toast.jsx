import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform max-w-md";

    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-100 border border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-100 border border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-100 border border-yellow-200 text-yellow-800`;
      default:
        return `${baseStyles} bg-blue-100 border border-blue-200 text-blue-800`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";

    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />;
      default:
        return <Info className={`${iconClass} text-blue-600`} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={handleClose}
        className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;