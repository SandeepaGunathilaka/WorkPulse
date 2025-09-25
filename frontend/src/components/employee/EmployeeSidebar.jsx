import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Calendar,
  Clock,
  ClipboardList,
  FileText,
  ChevronDown,
  ChevronRight,
  Building2,
  X,
  CheckCircle,
  DollarSign,
  Settings
} from 'lucide-react';

const EmployeeSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const sidebarRef = useRef(null);
  const resizeRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    attendance: false,
    leaves: false,
    profile: false
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
      if (newWidth >= 200 && newWidth <= 400) {
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

  useEffect(() => {
    // Add custom scrollbar styles
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #374151;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #6b7280;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/employee',
      exact: true
    },
    {
      id: 'profile',
      title: 'My Profile',
      icon: User,
      expandable: true,
      submenu: [
        { title: 'View Profile', icon: User, path: '/employee/profile' },
        { title: 'Edit Profile', icon: Settings, path: '/employee/profile/edit' }
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: CheckCircle,
      expandable: true,
      submenu: [
        { title: 'Clock In/Out', icon: Clock, path: '/employee/attendance' },
        { title: 'My Attendance', icon: ClipboardList, path: '/employee/attendance/history' },
        { title: 'Time Reports', icon: FileText, path: '/employee/attendance/reports' }
      ]
    },
    {
      id: 'leaves',
      title: 'Leave Management',
      icon: Calendar,
      expandable: true,
      submenu: [
        { title: 'Apply for Leave', icon: Calendar, path: '/employee/leaves/apply' },
        { title: 'My Leave Requests', icon: ClipboardList, path: '/employee/leaves' },
        { title: 'Leave Policies', icon: FileText, path: '/employee/leaves/policies' }
      ]
    },
    {
      id: 'schedule',
      title: 'My Schedule',
      icon: Clock,
      path: '/employee/schedule'
    },
    {
      id: 'salary',
      title: 'My Salary',
      icon: DollarSign,
      path: '/employee/salary'
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
            <div className="p-2 bg-green-600 rounded-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Employee Panel</h2>
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
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
          <p className="text-xs text-gray-400">WorkPulse Employee v1.0</p>
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
            backgroundColor: isResizing ? 'rgba(34, 197, 94, 0.5)' : 'transparent',
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
              backgroundColor: 'rgba(34, 197, 94, 0.3)',
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

export default EmployeeSidebar;