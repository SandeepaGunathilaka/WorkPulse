import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Building2,
  X,
  DollarSign
} from 'lucide-react';

const HRSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({
    employees: false,
    payroll: false,
    reports: false
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/hr',
      exact: true
    },
    {
      id: 'employees',
      title: 'Employee Management',
      icon: Users,
      expandable: true,
      submenu: [
        { title: 'All Employees', icon: Users, path: '/hr/employees' },
        { title: 'Add Employee', icon: UserPlus, path: '/hr/employees/add' },
        { title: 'Employee Records', icon: FileText, path: '/hr/employees/records' }
      ]
    },
    {
      id: 'payroll',
      title: 'Salary Management',
      icon: DollarSign,
      expandable: true,
      submenu: [
        { title: 'Generate Salary', icon: DollarSign, path: '/hr/salary/generate' },
        { title: 'Salary Records', icon: FileText, path: '/hr/salary/records' },
        { title: 'Payroll Reports', icon: BarChart3, path: '/hr/salary/reports' }
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: BarChart3,
      expandable: true,
      submenu: [
        { title: 'Employee Reports', icon: Users, path: '/hr/reports/employees' }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      path: '/hr/settings'
    }
  ];

  const SidebarLink = ({ item, isSubmenu = false }) => {
    const Icon = item.icon;
    const isActive = isActiveLink(item.path);

    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ${
          isSubmenu ? 'pl-12 text-sm' : ''
        } ${isActive ? 'bg-blue-600 text-white' : ''}`}
        onClick={onClose}
      >
        <Icon className={`${isSubmenu ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <span>{item.title}</span>
      </Link>
    );
  };

  const ExpandableMenuItem = ({ item }) => {
    const Icon = item.icon;
    const isExpanded = expandedMenus[item.id];
    const hasActiveSubmenu = item.submenu?.some(subItem => isActiveLink(subItem.path));

    return (
      <div>
        <button
          onClick={() => toggleMenu(item.id)}
          className={`w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ${
            hasActiveSubmenu ? 'bg-gray-700 text-white' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span>{item.title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-1">
            {item.submenu.map((subItem, index) => (
              <SidebarLink key={index} item={subItem} isSubmenu={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">HR Portal</h2>
                <p className="text-xs text-gray-400">WorkPulse</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.expandable ? (
                  <ExpandableMenuItem item={item} />
                ) : (
                  <SidebarLink item={item} />
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">WorkPulse HR v1.0</p>
            <p className="text-xs text-gray-500">Hospital Management System</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HRSidebar;