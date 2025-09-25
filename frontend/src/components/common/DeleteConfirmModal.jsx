import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item?",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  employeeName = "",
  employeeId = ""
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-3">{message}</p>

            {employeeName && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{employeeName}</p>
                    {employeeId && (
                      <p className="text-sm text-gray-500">ID: {employeeId}</p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {employeeName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Warning</h4>
                <p className="text-sm text-red-700">
                  Deleting this employee will permanently remove all their data, including:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                  <li>Personal information and contact details</li>
                  <li>Employment history and records</li>
                  <li>Associated department assignments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;