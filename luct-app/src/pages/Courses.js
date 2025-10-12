import React, { useState, useEffect } from 'react';
import { coursesAPI } from '../services/api';

const Courses = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    faculty_id: user?.faculty_id || ''
  });

  useEffect(() => {
    if (user) fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
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
      await coursesAPI.addCourse(formData);
      setShowForm(false);
      setFormData({ course_name: '', course_code: '', faculty_id: user.faculty_id });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view courses.</h4>
      </div>
    );
  }

  return (
    <div className="courses-page h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">Courses</h1>
        {user.role === 'Program Leader' && (
          <button className="btn btn-dark btn-sm" onClick={() => setShowForm(!showForm)}>
            <i className="bi bi-plus-circle me-1"></i> Add Course
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-header py-2"><small>Add New Course</small></div>
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
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-dark btn-sm">Create Course</button>
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
          <small>{user.role === 'Program Leader' ? 'All Courses' : 'Faculty Courses'}</small>
          <span className="badge bg-dark">{courses.length} courses</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Faculty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.course_id}>
                    <td><strong>{course.course_code}</strong></td>
                    <td>{course.course_name}</td>
                    <td><span className="badge bg-dark">{course.faculty_name}</span></td>
                    <td><span className="badge bg-success">Active</span></td>
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

export default Courses;
