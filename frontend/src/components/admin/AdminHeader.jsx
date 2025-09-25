import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Settings,
  User,
  LogOut,
  Menu,
  ChevronDown,
  Building2
} from 'lucide-react';

const AdminHeader = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-b border-blue-100 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-6">
          {/* Menu toggle for mobile */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl bg-white/50 backdrop-blur-sm border border-blue-200 text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo and title */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-20 h-12 p-2 bg-white rounded-lg shadow-md border border-gray-100">
              <img
                src="/Logo.png?v=1"
                alt="WorkPulse Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin Panel</h1>
              <p className="text-sm text-blue-600 font-medium">Hospital Management System</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search button for mobile */}
          <button className="md:hidden p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-blue-200 text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-sm">
            <Search className="w-5 h-5" />
          </button>


          {/* Settings */}
          <button className="p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-blue-200 text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-sm">
            <Settings className="w-5 h-5" />
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/50 backdrop-blur-sm border border-blue-200 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin'}</p>
                <span className="text-xs text-blue-600 font-medium">{user?.role || 'Administrator'}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-blue-600 transition-transform duration-200" />
            </button>

            {/* Profile dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100 z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">{user?.email || 'admin@hospital.lk'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200">
                    <User className="w-5 h-5" />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200">
                    <Settings className="w-5 h-5" />
                    <span>System Settings</span>
                  </button>
                </div>
                <div className="p-3 border-t border-blue-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-6 pb-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-12 pr-6 py-3 bg-white/70 backdrop-blur-sm border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white shadow-sm hover:shadow-md transition-all duration-200 placeholder-blue-400"
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
        </div>
      </div>

      {/* Overlay for mobile dropdowns */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => {
            setIsProfileOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default AdminHeader;