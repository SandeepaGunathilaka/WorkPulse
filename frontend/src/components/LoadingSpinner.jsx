const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-300 absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;