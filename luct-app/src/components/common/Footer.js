import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <footer className="footer mt-auto">
      <div className="container-fluid">
        <div className="row align-items-center py-1">
          <div className="col-md-6">
            <p className="mb-0 small">
              &copy; {currentYear} Limkokwing University of Creative Technology. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0 small">
              {user && (
                <span className="text-muted me-2">
                  Logged in as: <strong>{user.role}</strong>
                </span>
              )}
              <span className="text-muted">
                LUCT Reporting System v1.0
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
