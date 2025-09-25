import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  ClipboardList,
  DollarSign,
  BarChart3,
  Settings,
  Database,
  Shield,
  FileText,
  Clock,
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  Building2,
  X
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const sidebarRef = useRef(null);
  const resizeRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    employees: false,
    leaves: false
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Resize functionality
  const startResize = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
        if (sidebarRef.current) {
          sidebarRef.current.style.width = `${newWidth}px`;
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      exact: true
    },
    {
      id: 'employees',
      title: 'Employee Management',
      icon: Users,
      expandable: true,
      submenu: [
        { title: 'All Employees', icon: Users, path: '/admin/employees' }
      ]
    },
    {
      id: 'leaves',
      title: 'Leave Management',
      icon: Calendar,
      expandable: true,
      submenu: [
        { title: 'Leave Requests', icon: Calendar, path: '/admin/leaves' },
        { title: 'Leave Policies', icon: ClipboardList, path: '/admin/leaves/policies' },
        { title: 'Leave Balance', icon: Activity, path: '/admin/leaves/balance' }
      ]
    },
    {
      id: 'schedules',
      title: 'Schedules',
      icon: ClipboardList,
      path: '/admin/schedules'
    },
    {
      id: 'salary',
      title: 'Salary Management',
      icon: DollarSign,
      path: '/admin/salary'
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
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isResizing ? 'transition-none' : ''}`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
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
            <div key={item.id} className="nav-group">
              {item.expandable ? (
                <ExpandableMenuItem item={item} />
              ) : (
                <SidebarLink item={item} />
              )}
            </div>
          ))}
        </nav>

        {/* Version info */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">WorkPulse Admin v1.0</p>
          <p className="text-xs text-gray-500">Hospital Management System</p>
        </div>

        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="sidebar-resize-handle"
          onMouseDown={startResize}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '4px',
            height: '100%',
            cursor: 'col-resize',
            backgroundColor: isResizing ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
            transition: 'background-color 0.2s ease',
            zIndex: 1000
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-2px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '40px',
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
              borderRadius: '4px',
              opacity: isResizing ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;