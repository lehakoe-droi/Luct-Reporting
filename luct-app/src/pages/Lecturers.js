import React, { useState, useEffect } from 'react';
import { lecturersAPI } from '../services/api';

const Lecturers = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'Program Leader') {
      fetchLecturers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchLecturers = async () => {
    try {
      const response = await lecturersAPI.getLecturers();
      setLecturers(response.data);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view this page.</h4>
      </div>
    );
  }

  if (user.role !== 'Program Leader') {
    return (
      <div className="alert alert-danger m-3">
        <h4>Access Denied</h4>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-grow-1">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lecturers-page h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">Lecturers Management</h1>
        <span className="badge bg-dark">{lecturers.length} lecturers</span>
      </div>

      <div className="card flex-grow-1">
        <div className="card-header py-2">
          <small>Faculty Lecturers</small>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Faculty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((lecturer) => (
                  <tr key={lecturer.user_id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="avatar bg-dark text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                          style={{ width: '35px', height: '35px', fontSize: '0.8rem' }}
                        >
                          {lecturer.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <strong className="small">{lecturer.full_name}</strong>
                        </div>
                      </div>
                    </td>
                    <td className="small">{lecturer.email}</td>
                    <td className="small">{lecturer.username}</td>
                    <td className="small">{lecturer.faculty_name}</td>
                    <td>
                      <span className="badge bg-success small">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lecturers;
