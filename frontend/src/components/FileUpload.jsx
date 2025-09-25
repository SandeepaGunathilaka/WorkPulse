import { useState, useRef } from 'react';
import api from '../services/api';
import { Upload, X, Check, AlertCircle } from 'lucide-react';

const FileUpload = ({
  type = 'profile-picture', // 'profile-picture' or 'document'
  onUploadSuccess,
  onUploadError,
  acceptedTypes = 'image/*',
  maxSize = 5, // MB
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const allowedTypes = acceptedTypes.split(',').map(type => type.trim());
    const isValidType = allowedTypes.some(allowedType => {
      if (allowedType === 'image/*') return file.type.startsWith('image/');
      if (allowedType === 'application/*') return file.type.startsWith('application/');
      return file.type === allowedType;
    });

    if (!isValidType) {
      setError('Invalid file type');
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    const formData = new FormData();

    if (type === 'profile-picture') {
      formData.append('profilePicture', file);
    } else {
      formData.append('document', file);
    }

    try {
      const response = await api.post(`/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      });

      setSuccess(true);
      setUploadProgress(100);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.data);
      }

      // Reset after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Upload failed';
      setError(errorMessage);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <button
        onClick={triggerFileSelect}
        disabled={uploading}
        className={`
          relative flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg
          transition-colors duration-200 w-full
          ${uploading
            ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
            : error
              ? 'border-red-300 bg-red-50 hover:border-red-400'
              : success
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
        `}
      >
        {uploading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">Uploading... {uploadProgress}%</span>
          </div>
        ) : success ? (
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">Upload successful!</span>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {type === 'profile-picture' ? 'Upload Profile Picture' : 'Upload Document'}
            </span>
          </div>
        )}
      </button>

      {/* Progress bar */}
      {uploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Clear error button */}
      {error && (
        <button
          onClick={() => setError(null)}
          className="absolute top-1 right-1 p-1 text-red-600 hover:text-red-800"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default FileUpload;