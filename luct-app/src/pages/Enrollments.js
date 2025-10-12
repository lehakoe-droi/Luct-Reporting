import React, { useState, useEffect } from 'react';
import { classesAPI, enrollmentsAPI } from '../services/api';

const Enrollments = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (user && user.role === 'Student') {
      fetchAvailableClasses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAvailableClasses = async () => {
    try {
      const response = await classesAPI.getAvailableClasses();
      setAvailableClasses(response.data);
    } catch (error) {
      console.error('Error fetching available classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    setEnrolling(true);
    try {
      await enrollmentsAPI.enroll(classId);
      fetchAvailableClasses(); // Refresh available classes
    } catch (error) {
      console.error('Error enrolling in class:', error);
    } finally {
      setEnrolling(false);
    }
  };

  if (!user || user.role !== 'Student') {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">Access denied. Only students can enroll in classes.</h4>
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
    <div className="enrollments-page h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">Enroll in Classes</h1>
      </div>

      <div className="row">
        {availableClasses.map((classItem) => (
          <div key={classItem.class_id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>{classItem.class_name}</strong>
                <span className="badge bg-warning">Available</span>
              </div>
              <div className="card-body">
                <h6 className="card-title text-muted">{classItem.course_name}</h6>
                <p className="card-text">
                  <small className="text-muted">
                    <i className="bi bi-code-slash me-1"></i>
                    {classItem.course_code}
                  </small>
                </p>

                <div className="class-info mt-3">
                  <div className="d-flex justify-content-between text-sm mb-2">
                    <span>Venue:</span>
                    <strong>{classItem.venue || 'TBA'}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-sm mb-2">
                    <span>Time:</span>
                    <strong>
                      {classItem.scheduled_time
                        ? new Date(classItem.scheduled_time).toLocaleString()
                        : 'TBA'}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between text-sm mb-2">
                    <span>Lecturer:</span>
                    <strong>{classItem.lecturer_name}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-sm">
                    <span>Students:</span>
                    <strong>{classItem.total_registered_students || 0}</strong>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-transparent">
                <button
                  className="btn btn-sm btn-primary w-100"
                  onClick={() => handleEnroll(classItem.class_id)}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-1"></i> Enroll Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {availableClasses.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-book display-1 text-muted"></i>
          <h4 className="text-muted mt-3">No Classes Available</h4>
          <p className="text-muted">All classes are full or you are already enrolled in all available classes.</p>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
