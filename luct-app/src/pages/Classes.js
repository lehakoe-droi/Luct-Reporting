import React, { useState, useEffect } from 'react';
import { classesAPI, coursesAPI, lecturersAPI } from '../services/api';

const Classes = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  console.log('User role:', user?.role);
  console.log('Show button:', user?.role === 'Program Leader' || user?.role === 'Principal Lecturer');

  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      if (user.role === 'Program Leader' || user.role === 'Principal Lecturer') {
        fetchCourses();
        fetchLecturers();
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await lecturersAPI.getLecturers();
      setLecturers(response.data);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
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
      await classesAPI.addClass(formData);
      alert('Class added successfully!');
      setShowForm(false);
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
      console.error('Error creating class:', error);
      alert('Failed to add class: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view classes.</h4>
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
    <div className="classes-page h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">
          {user.role === 'Student'
            ? 'My Classes'
            : user.role === 'Lecturer'
            ? 'My Teaching Classes'
            : 'All Classes'}
        </h1>
        {(user.role === 'Program Leader' || user.role === 'Principal Lecturer') && (
          <button className="btn btn-dark btn-sm" onClick={() => { console.log('Add Class button clicked'); setShowForm(!showForm); }}>
            <i className="bi bi-plus-circle me-1"></i> Add Class
          </button>
        )}
      </div>

      <div className="row">
        {classes.map((classItem) => (
          <div key={classItem.class_id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>{classItem.class_name}</strong>
                <span className="badge bg-dark">Active</span>
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
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-dark flex-fill">
                    <i className="bi bi-eye me-1"></i> View Details
                  </button>
                  {user.role === 'Student' && (
                    <button className="btn btn-sm btn-dark flex-fill">
                      <i className="bi bi-download me-1"></i> Materials
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-header py-2"><small>Add New Class</small></div>
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
                      {courses.map(course => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
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
                      {lecturers.map(lecturer => (
                        <option key={lecturer.user_id} value={lecturer.user_id}>
                          {lecturer.full_name}
                        </option>
                      ))}
                    </select>
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
                <button type="submit" className="btn btn-dark btn-sm">Create Class</button>
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

      {classes.length === 0 && (
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
  );
};

export default Classes;
