import { useState } from 'react';
import { Download, FileText, X, Users, User } from 'lucide-react';

const ExportModal = ({
  isOpen,
  onClose,
  onExportAll,
  onExportFiltered,
  totalEmployees,
  filteredEmployees,
  currentFilters
}) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);

  if (!isOpen) return null;

  const hasFilters = Object.keys(currentFilters).some(key => currentFilters[key]);

  const handleExport = () => {
    const options = {
      format: selectedFormat,
      includeDetails,
      includeStats
    };

    if (hasFilters) {
      onExportFiltered(options);
    } else {
      onExportAll(options);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export Employee Report</h3>
                <p className="text-sm text-gray-500">Generate and download employee data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Scope</label>
            <div className="space-y-3">
              {hasFilters && (
                <div className="flex items-start gap-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-blue-900">Filtered Results</h4>
                      <span className="text-sm font-medium text-blue-700">{filteredEmployees} employees</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">Export current filtered view</p>
                    {Object.keys(currentFilters).length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-blue-800 mb-1">Active Filters:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(currentFilters).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">All Employees</h4>
                    <span className="text-sm font-medium text-gray-700">{totalEmployees} employees</span>
                  </div>
                  <p className="text-sm text-gray-600">Export complete employee database</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Options</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Include statistics and summary</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Include detailed employee information</span>
              </label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">PDF Report Preview</h4>
                <p className="text-sm text-gray-600">
                  Your report will include employee data
                  {includeStats ? ', statistics' : ''}
                  {includeDetails ? ', and detailed information' : ''}
                  . The file will be downloaded automatically.
                </p>
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
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;