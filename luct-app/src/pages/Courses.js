import React, { useState, useEffect, useMemo } from 'react';
import { coursesAPI } from '../services/api';

const Courses = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    faculty_id: user?.faculty_id || ''
  });

  useEffect(() => {
    if (user) {
      fetchCourses();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper function to normalize API responses
  const normalizeArrayResponse = (responseData) => {
    console.log('Normalizing courses response:', responseData);
    
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.courses)) {
      return responseData.courses;
    } else if (responseData && responseData.success && Array.isArray(responseData.data)) {
      return responseData.data;
    } else {
      console.warn('Unexpected courses response format:', responseData);
      return [];
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching courses...');
      
      const response = await coursesAPI.getCourses();
      console.log('Courses API response:', response);
      
      const coursesData = normalizeArrayResponse(response.data);
      console.log('Normalized courses data:', coursesData);
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses: ' + (error.response?.data?.error || error.message));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting course form:', formData);
      await coursesAPI.addCourse(formData);
      alert('Course created successfully!');
      setShowForm(false);
      setFormData({ 
        course_name: '', 
        course_code: '', 
        faculty_id: user?.faculty_id || '' 
      });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course: ' + (error.response?.data?.error || error.message));
    }
  };

  // Safe array to prevent errors
  const safeCourses = Array.isArray(courses) ? courses : [];

  console.log('Courses component state:', {
    user: user?.username,
    role: user?.role,
    coursesCount: safeCourses.length,
    loading,
    error
  });

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view courses.</h4>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-grow-1">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="courses-page h-100">
      {/* Debug Info */}
      <div className="alert alert-info mb-3">
        <small>
          <strong>Debug Info:</strong> 
          User: {user?.username} | 
          Role: {user?.role} | 
          Faculty ID: {user?.faculty_id} | 
          Courses: {safeCourses.length}
        </small>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchCourses}
          >
            Retry
          </button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">Courses</h1>
        {user.role === 'Program Leader' && (
          <button 
            className="btn btn-dark btn-sm" 
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-1"></i> Add Course
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-header py-2">
            <small>Add New Course</small>
          </div>
          <div className="card-body p-3">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Course Name</label>
                    <input
                      type="text"
                      name="course_name"
                      value={formData.course_name}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="e.g., Introduction to Programming"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Course Code</label>
                    <input
                      type="text"
                      name="course_code"
                      value={formData.course_code}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="e.g., CS101"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">
                  Course will be assigned to your faculty automatically.
                </small>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-dark btn-sm">
                  Create Course
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card flex-grow-1">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <small>
            {user.role === 'Program Leader' 
              ? 'All Courses' 
              : user.role === 'Lecturer' 
                ? 'My Teaching Courses'
                : 'Available Courses'
            }
          </small>
          <span className="badge bg-dark">{safeCourses.length} courses</span>
        </div>
        <div className="card-body p-0">
          {safeCourses.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Faculty</th>
                    {user.role === 'Program Leader' && <th>Program Leader</th>}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {safeCourses.map(course => (
                    <tr key={course.course_id}>
                      <td>
                        <strong>{course.course_code}</strong>
                      </td>
                      <td>
                        <div className="fw-semibold">{course.course_name}</div>
                        {course.description && (
                          <small className="text-muted">{course.description}</small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-dark">
                          {course.faculty_name || `Faculty ${course.faculty_id}`}
                        </span>
                      </td>
                      {user.role === 'Program Leader' && (
                        <td>
                          <small className="text-muted">
                            {course.program_leader_name || 'Not assigned'}
                          </small>
                        </td>
                      )}
                      <td>
                        <span className="badge bg-success">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-book display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Courses Found</h4>
              <p className="text-muted">
                {user.role === 'Program Leader'
                  ? 'No courses have been created yet.'
                  : user.role === 'Lecturer'
                  ? 'You are not assigned to any courses yet.'
                  : 'No courses available in your faculty.'
                }
              </p>
              {user.role === 'Program Leader' && !showForm && (
                <button 
                  className="btn btn-dark btn-sm mt-2"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Create First Course
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {safeCourses.length > 0 && (
        <div className="row mt-3">
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center py-2">
                <h6 className="mb-0">{safeCourses.length}</h6>
                <small className="text-muted">Total Courses</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center py-2">
                <h6 className="mb-0 text-success">{safeCourses.length}</h6>
                <small className="text-muted">Active</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center py-2">
                <h6 className="mb-0 text-muted">0</h6>
                <small className="text-muted">Inactive</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light">
              <div className="card-body text-center py-2">
                <h6 className="mb-0 text-info">
                  {new Set(safeCourses.map(c => c.faculty_id)).size}
                </h6>
                <small className="text-muted">Faculties</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;