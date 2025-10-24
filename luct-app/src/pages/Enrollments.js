import React, { useState, useEffect, useMemo } from 'react';
import { classesAPI, enrollmentsAPI } from '../services/api';

const Enrollments = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user && user.role === 'Student') {
      fetchAvailableClasses();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper function to normalize API responses
  const normalizeArrayResponse = (responseData) => {
    console.log('Normalizing enrollments response:', responseData);
    
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.classes)) {
      return responseData.classes;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    } else if (responseData && responseData.success && Array.isArray(responseData.availableClasses)) {
      return responseData.availableClasses;
    } else {
      console.warn('Unexpected enrollments response format:', responseData);
      return [];
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching available classes...');
      
      const response = await classesAPI.getAvailableClasses();
      console.log('Available classes API response:', response);
      
      const classesData = normalizeArrayResponse(response.data);
      console.log('Normalized available classes:', classesData);
      
      setAvailableClasses(classesData);
    } catch (error) {
      console.error('Error fetching available classes:', error);
      setError('Failed to load available classes: ' + (error.response?.data?.error || error.message));
      setAvailableClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId, className) => {
    setEnrolling(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Enrolling in class:', classId);
      await enrollmentsAPI.enroll(classId);
      
      setSuccess(`Successfully enrolled in ${className}!`);
      fetchAvailableClasses(); // Refresh available classes
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error enrolling in class:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to enroll in class';
      setError(`Enrollment failed: ${errorMsg}`);
    } finally {
      setEnrolling(false);
    }
  };

  // Safe array to prevent errors
  const safeAvailableClasses = Array.isArray(availableClasses) ? availableClasses : [];

  console.log('Enrollments component state:', {
    user: user?.username,
    role: user?.role,
    availableClassesCount: safeAvailableClasses.length,
    loading,
    enrolling,
    error,
    success
  });

  if (!user || user.role !== 'Student') {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">Access denied. Only students can enroll in classes.</h4>
        <p className="text-muted">
          Current user: {user?.username} (Role: {user?.role})
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-grow-1">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading available classes...</span>
      </div>
    );
  }

  return (
    <div className="enrollments-page h-100">
      {/* Debug Info */}
      <div className="alert alert-info mb-3">
        <small>
          <strong>Debug Info:</strong> 
          Student: {user?.username} | 
          Available Classes: {safeAvailableClasses.length}
        </small>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchAvailableClasses}
          >
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-3">
          <strong>Success!</strong> {success}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4">Enroll in Classes</h1>
          <p className="text-muted mb-0">
            Browse and enroll in available classes for your courses.
          </p>
        </div>
        <button 
          className="btn btn-outline-dark btn-sm"
          onClick={fetchAvailableClasses}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      <div className="card flex-grow-1 border-0 shadow-sm">
        <div className="card-header py-2 bg-dark text-white d-flex justify-content-between align-items-center">
          <small>Available Classes for Enrollment</small>
          <span className="badge bg-light text-dark">{safeAvailableClasses.length} classes</span>
        </div>
        <div className="card-body p-0">
          {safeAvailableClasses.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Class Name</th>
                    <th>Course</th>
                    <th>Venue</th>
                    <th>Scheduled Time</th>
                    <th>Lecturer</th>
                    <th>Enrolled</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeAvailableClasses.map((classItem) => (
                    <tr key={classItem.class_id}>
                      <td>
                        <strong>{classItem.class_name}</strong>
                        {classItem.description && (
                          <small className="d-block text-muted">{classItem.description}</small>
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold">{classItem.course_name}</div>
                        <small className="text-muted">{classItem.course_code}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {classItem.venue || 'TBA'}
                        </span>
                      </td>
                      <td>
                        {classItem.scheduled_time ? (
                          <>
                            <div className="fw-semibold">
                              {new Date(classItem.scheduled_time).toLocaleDateString()}
                            </div>
                            <small className="text-muted">
                              {new Date(classItem.scheduled_time).toLocaleTimeString()}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">TBA</span>
                        )}
                      </td>
                      <td>
                        <div>{classItem.lecturer_name}</div>
                        {classItem.lecturer_email && (
                          <small className="text-muted">{classItem.lecturer_email}</small>
                        )}
                      </td>
                      <td>
                        <div className="text-center">
                          <span className="fw-bold">{classItem.total_registered_students || 0}</span>
                          <small className="d-block text-muted">students</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i> Available
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-dark"
                          onClick={() => handleEnroll(classItem.class_id, classItem.class_name)}
                          disabled={enrolling}
                          title={`Enroll in ${classItem.class_name}`}
                        >
                          {enrolling ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-plus-circle me-1"></i> Enroll
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-book display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Classes Available</h4>
              <p className="text-muted">
                {loading ? 'Loading classes...' : 'All classes are full or you are already enrolled in all available classes.'}
              </p>
              {!loading && (
                <button 
                  className="btn btn-dark btn-sm mt-2"
                  onClick={fetchAvailableClasses}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Check Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Tips */}
      {safeAvailableClasses.length > 0 && (
        <div className="card border-0 bg-light mt-3">
          <div className="card-body py-2">
            <div className="row">
              <div className="col-md-4 text-center">
                <small>
                  <i className="bi bi-info-circle text-primary me-1"></i>
                  <strong>Select carefully</strong> - Choose classes that fit your schedule
                </small>
              </div>
              <div className="col-md-4 text-center">
                <small>
                  <i className="bi bi-clock text-primary me-1"></i>
                  <strong>Check times</strong> - Ensure you can attend all scheduled sessions
                </small>
              </div>
              <div className="col-md-4 text-center">
                <small>
                  <i className="bi bi-people text-primary me-1"></i>
                  <strong>Limited seats</strong> - Popular classes fill up quickly
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollments;