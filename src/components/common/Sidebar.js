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
    const baseItems = [{ path: '/', icon: 'bi-house', label: 'Dashboard' }];

    if (!user) return baseItems;

    switch (user.role) {
      case 'Student':
        return [
          ...baseItems,
          { path: '/classes', icon: 'bi-book', label: 'My Classes' },
          { path: '/enrollments', icon: 'bi-plus-circle', label: 'Enroll in Classes' },
          { path: '/reports', icon: 'bi-clipboard', label: 'View Reports' },
          { path: '/ratings', icon: 'bi-star', label: 'Rating' },
        ];

      case 'Lecturer':
        return [
          ...baseItems,
          { path: '/classes', icon: 'bi-book', label: 'My Classes' },
          { path: '/reports', icon: 'bi-clipboard', label: 'Reports' },
          { path: '/monitoring', icon: 'bi-graph-up', label: 'Monitoring' },
          { path: '/ratings', icon: 'bi-star', label: 'Rating' },
        ];

      case 'Principal Lecturer':
        return [
          ...baseItems,
          { path: '/courses', icon: 'bi-journal', label: 'Courses' },
          { path: '/reports', icon: 'bi-clipboard', label: 'Reports' },
          { path: '/monitoring', icon: 'bi-graph-up', label: 'Monitoring' },
          { path: '/ratings', icon: 'bi-star', label: 'Rating' },
          { path: '/classes', icon: 'bi-book', label: 'Classes' },
        ];

      case 'Program Leader':
        return [
          ...baseItems,
          { path: '/courses', icon: 'bi-journal', label: 'Courses' },
          { path: '/reports', icon: 'bi-clipboard', label: 'Reports' },
          { path: '/monitoring', icon: 'bi-graph-up', label: 'Monitoring' },
          { path: '/classes', icon: 'bi-book', label: 'Classes' },
          { path: '/lecturers', icon: 'bi-people', label: 'Lecturers' },
          { path: '/ratings', icon: 'bi-star', label: 'Rating' },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="sidebar d-flex flex-column">
      <nav className="nav flex-column">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <i className={`${item.icon} me-2`}></i>
            {item.label}
          </Link>
        ))}

        {/* Logout button at the bottom */}
        {user && (
          <button
            className="nav-link text-danger mt-auto"
            onClick={handleLogout}
            style={{ border: 'none', background: 'none', textAlign: 'left' }}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
