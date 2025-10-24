import React, { useState, useEffect, useMemo } from 'react';
import { classesAPI, coursesAPI, lecturersAPI } from '../services/api';

const Classes = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  console.log('User role:', user?.role);
  console.log('Show button:', user?.role === 'Program Leader' || user?.role === 'Principal Lecturer');

  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    course_id: '',
    lecturer_id: '',
    venue: '',
    scheduled_time: '',
    total_registered_students: 0
  });

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchCourses();
      fetchLecturers();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper function to normalize API responses
  const normalizeArrayResponse = (responseData) => {
    console.log('Normalizing response:', responseData);
    
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.classes)) {
      return responseData.classes;
    } else if (responseData && Array.isArray(responseData.courses)) {
      return responseData.courses;
    } else if (responseData && Array.isArray(responseData.lecturers)) {
      return responseData.lecturers;
    } else if (responseData && responseData.success && Array.isArray(responseData.data)) {
      return responseData.data;
    } else {
      console.warn('Unexpected response format:', responseData);
      return [];
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching classes...');
      
      const response = await classesAPI.getClasses();
      console.log('Classes API response:', response);
      
      const classesData = normalizeArrayResponse(response.data);
      console.log('Normalized classes:', classesData);
      
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes: ' + (error.response?.data?.error || error.message));
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...');
      const response = await coursesAPI.getCourses();
      console.log('Courses API response:', response);
      
      const coursesData = normalizeArrayResponse(response.data);
      console.log('Normalized courses:', coursesData);
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(prev => prev ? `${prev} | Courses: ${error.message}` : `Failed to load courses: ${error.message}`);
      setCourses([]);
    }
  };

  const fetchLecturers = async () => {
    try {
      console.log('Fetching lecturers...');
      const response = await lecturersAPI.getLecturers();
      console.log('Lecturers API response:', response);
      
      const lecturersData = normalizeArrayResponse(response.data);
      console.log('Normalized lecturers:', lecturersData);
      
      setLecturers(lecturersData);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      setError(prev => prev ? `${prev} | Lecturers: ${error.message}` : `Failed to load lecturers: ${error.message}`);
      setLecturers([]);
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
    console.log('Submitting form', formData);
    try {
      if (editingClass) {
        await classesAPI.editClass(editingClass.class_id, formData);
        alert('Class updated successfully!');
      } else {
        await classesAPI.addClass(formData);
        alert('Class added successfully!');
      }
      setShowForm(false);
      setEditingClass(null);
      setFormData({
        class_name: '',
        course_id: '',
        lecturer_id: '',
        venue: '',
        scheduled_time: '',
        total_registered_students: 0
      });
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      class_name: classItem.class_name,
      course_id: classItem.course_id,
      lecturer_id: classItem.lecturer_id,
      venue: classItem.venue || '',
      scheduled_time: classItem.scheduled_time ? new Date(classItem.scheduled_time).toISOString().slice(0, 16) : '',
      total_registered_students: classItem.total_registered_students || 0
    });
    setShowForm(true);
  };

  const handleDelete = (classItem) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await classesAPI.deleteClass(classToDelete.class_id);
      alert('Class deleted successfully!');
      setShowDeleteModal(false);
      setClassToDelete(null);
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormData({
      class_name: '',
      course_id: '',
      lecturer_id: '',
      venue: '',
      scheduled_time: '',
      total_registered_students: 0
    });
  };

  // Safe arrays to prevent errors
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeLecturers = Array.isArray(lecturers) ? lecturers : [];

  console.log('Current state:', {
    classesCount: safeClasses.length,
    coursesCount: safeCourses.length,
    lecturersCount: safeLecturers.length,
    loading,
    error
  });

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view classes.</h4>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="classes-page h-100">
        <div className="row mb-3">
          <div className="col-12">
            <div className="placeholder-glow">
              <span className="placeholder col-4"></span>
            </div>
            <div className="placeholder-glow mt-2">
              <span className="placeholder col-6"></span>
            </div>
          </div>
        </div>

        {/* Skeleton Table */}
        <div className="card flex-grow-1">
          <div className="card-header py-2">
            <div className="placeholder-glow">
              <span className="placeholder col-3"></span>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th><div className="placeholder-glow"><span className="placeholder col-8"></span></div></th>
                    <th><div className="placeholder-glow"><span className="placeholder col-6"></span></div></th>
                    <th><div className="placeholder-glow"><span className="placeholder col-4"></span></div></th>
                    <th><div className="placeholder-glow"><span className="placeholder col-5"></span></div></th>
                    <th><div className="placeholder-glow"><span className="placeholder col-7"></span></div></th>
                    <th><div className="placeholder-glow"><span className="placeholder col-3"></span></div></th>
                    <th><div className="placeholder-glow"><span className="placeholder col-4"></span></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td><div className="placeholder-glow"><span className="placeholder col-8"></span></div></td>
                      <td><div className="placeholder-glow"><span className="placeholder col-6"></span></div></td>
                      <td><div className="placeholder-glow"><span className="placeholder col-4"></span></div></td>
                      <td><div className="placeholder-glow"><span className="placeholder col-5"></span></div></td>
                      <td><div className="placeholder-glow"><span className="placeholder col-7"></span></div></td>
                      <td><div className="placeholder-glow"><span className="placeholder col-3"></span></div></td>
                      <td><div className="placeholder-glow"><span className="placeholder col-4"></span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classes-page h-100">


      {error && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchClasses}
          >
            Retry
          </button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">
          {user.role === 'Student'
            ? 'My Classes'
            : user.role === 'Lecturer'
            ? 'My Teaching Classes'
            : 'All Classes'}
        </h1>
        {(user.role === 'Program Leader' || user.role === 'Principal Lecturer') && (
          <button 
            className="btn btn-dark btn-sm" 
            onClick={() => { 
              console.log('Add Class button clicked'); 
              setShowForm(!showForm); 
            }}
          >
            <i className="bi bi-plus-circle me-1"></i> Add Class
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-header py-2">
            <small>{editingClass ? 'Edit Class' : 'Add New Class'}</small>
          </div>
          <div className="card-body p-3">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Class Name</label>
                    <input
                      type="text"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Course</label>
                    <select
                      name="course_id"
                      value={formData.course_id}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Course</option>
                      {safeCourses.map(course => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                    {safeCourses.length === 0 && (
                      <small className="text-danger">No courses available</small>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Lecturer</label>
                    <select
                      name="lecturer_id"
                      value={formData.lecturer_id}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Lecturer</option>
                      {safeLecturers.map(lecturer => (
                        <option key={lecturer.user_id} value={lecturer.user_id}>
                          {lecturer.full_name}
                        </option>
                      ))}
                    </select>
                    {safeLecturers.length === 0 && (
                      <small className="text-danger">No lecturers available</small>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Venue</label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Scheduled Time</label>
                    <input
                      type="datetime-local"
                      name="scheduled_time"
                      value={formData.scheduled_time}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Total Registered Students</label>
                    <input
                      type="number"
                      name="total_registered_students"
                      value={formData.total_registered_students}
                      onChange={handleChange}
                      className="form-control"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button 
                  type="submit" 
                  className="btn btn-dark btn-sm"
                  disabled={safeCourses.length === 0 || safeLecturers.length === 0}
                >
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={resetForm}
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
          <small>{user.role === 'Student' ? 'My Classes' : user.role === 'Lecturer' ? 'My Teaching Classes' : 'All Classes'}</small>
          <span className="badge bg-dark">{safeClasses.length} classes</span>
        </div>
        <div className="card-body p-0">
          {safeClasses.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Course</th>
                    <th>Venue</th>
                    <th>Scheduled Time</th>
                    <th>Lecturer</th>
                    <th>Students</th>
                    <th>Status</th>
                    {(user.role === 'Program Leader' || user.role === 'Principal Lecturer') && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {safeClasses.map((classItem) => (
                    <tr key={classItem.class_id}>
                      <td><strong>{classItem.class_name}</strong></td>
                      <td>
                        <div>{classItem.course_name}</div>
                        <small className="text-muted">{classItem.course_code}</small>
                      </td>
                      <td>{classItem.venue || 'TBA'}</td>
                      <td>
                        {classItem.scheduled_time
                          ? new Date(classItem.scheduled_time).toLocaleString()
                          : 'TBA'}
                      </td>
                      <td>{classItem.lecturer_name}</td>
                      <td>{classItem.total_registered_students || 0}</td>
                      <td><span className="badge bg-success">Active</span></td>
                      {(user.role === 'Program Leader' || user.role === 'Principal Lecturer') && (
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(classItem)}
                              title="Edit Class"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(classItem)}
                              title="Delete Class"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-book display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Classes Found</h4>
              <p className="text-muted">
                {user.role === 'Student'
                  ? 'You are not enrolled in any classes yet.'
                  : user.role === 'Lecturer'
                  ? 'You are not assigned to any classes yet.'
                  : 'No classes available in your faculty.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete the class "{classToDelete?.class_name}"? This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;