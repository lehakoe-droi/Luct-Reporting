import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  const getMenuItems = () => {
    const baseItems = [
      { 
        path: '/', 
        icon: 'bi-house', 
        label: 'Dashboard',
        description: 'Overview and analytics'
      }
    ];

    if (!user) return baseItems;

    switch (user.role) {
      case 'Student':
        return [
          ...baseItems,
          { 
            path: '/classes', 
            icon: 'bi-book', 
            label: 'My Classes',
            description: 'View enrolled classes'
          },
          { 
            path: '/enrollments', 
            icon: 'bi-plus-circle', 
            label: 'Enrollments',
            description: 'Enroll in new classes'
          },
          { 
            path: '/grades', 
            icon: 'bi-award', 
            label: 'My Grades',
            description: 'View academic grades'
          },
          { 
            path: '/monitoring', 
            icon: 'bi-graph-up', 
            label: 'Progress',
            description: 'Track your progress'
          },
          { 
            path: '/ratings', 
            icon: 'bi-star', 
            label: 'Ratings',
            description: 'Rate your lecturers'
          },
        ];

      case 'Lecturer':
        return [
          ...baseItems,
          { 
            path: '/classes', 
            icon: 'bi-book', 
            label: 'My Classes',
            description: 'Teaching schedule'
          },
          { 
            path: '/reports', 
            icon: 'bi-clipboard', 
            label: 'Reports',
            description: 'Submit teaching reports'
          },
          { 
            path: '/grades', 
            icon: 'bi-award', 
            label: 'Grades',
            description: 'Manage student grades'
          },
          { 
            path: '/monitoring', 
            icon: 'bi-graph-up', 
            label: 'Monitoring',
            description: 'Class performance'
          },
          { 
            path: '/ratings', 
            icon: 'bi-star', 
            label: 'Ratings',
            description: 'Student feedback'
          },
        ];

      case 'Principal Lecturer':
        return [
          ...baseItems,
          { 
            path: '/courses', 
            icon: 'bi-journal', 
            label: 'Courses',
            description: 'Course management'
          },
          { 
            path: '/reports', 
            icon: 'bi-clipboard-check', 
            label: 'Reports',
            description: 'Review teaching reports'
          },
          { 
            path: '/monitoring', 
            icon: 'bi-graph-up', 
            label: 'Monitoring',
            description: 'Faculty overview'
          },
          { 
            path: '/ratings', 
            icon: 'bi-star', 
            label: 'Ratings',
            description: 'Lecturer ratings'
          },
          { 
            path: '/classes', 
            icon: 'bi-book', 
            label: 'Classes',
            description: 'All classes overview'
          },
        ];

      case 'Program Leader':
        return [
          ...baseItems,
          { 
            path: '/courses', 
            icon: 'bi-journal-plus', 
            label: 'Courses',
            description: 'Manage courses'
          },
          { 
            path: '/reports', 
            icon: 'bi-clipboard-data', 
            label: 'Reports',
            description: 'View all reports'
          },
          { 
            path: '/monitoring', 
            icon: 'bi-graph-up-arrow', 
            label: 'Monitoring',
            description: 'Program analytics'
          },
          { 
            path: '/classes', 
            icon: 'bi-book', 
            label: 'Classes',
            description: 'Class management'
          },
          { 
            path: '/lecturers', 
            icon: 'bi-people', 
            label: 'Lecturers',
            description: 'Lecturer management'
          },
          { 
            path: '/ratings', 
            icon: 'bi-star', 
            label: 'Ratings',
            description: 'Rating overview'
          },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="sidebar d-flex flex-column bg-dark text-white">
      {/* User Info */}
      {user && (
        <div className="sidebar-header p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center">
            <div 
              className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}
            >
              {user.full_name 
                ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                : user.username?.charAt(0).toUpperCase() || 'U'
              }
            </div>
            <div>
              <div className="fw-bold small">{user.full_name || user.username}</div>
              <div className="text-muted small text-capitalize">{user.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="nav flex-column flex-grow-1 p-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link sidebar-link d-flex align-items-center py-2 px-3 mb-1 rounded ${
              isActive(item.path) 
                ? 'bg-primary text-white' 
                : 'text-white-50 hover-bg'
            }`}
            title={item.description}
          >
            <i className={`${item.icon} me-3`} style={{ width: '20px' }}></i>
            <div className="flex-grow-1">
              <div className="small">{item.label}</div>
            </div>
            {isActive(item.path) && (
              <i className="bi bi-chevron-right small"></i>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      {user && (
        <div className="sidebar-footer p-3 border-top border-secondary">
          <button
            className="nav-link sidebar-link d-flex align-items-center w-100 py-2 px-3 rounded text-danger border-0 bg-transparent"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-3" style={{ width: '20px' }}></i>
            <span className="small">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;