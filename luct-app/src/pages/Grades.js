import React, { useState, useEffect, useMemo } from 'react';
import { gradesAPI, classesAPI } from '../services/api';

const Grades = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
    grade: '',
    grade_type: 'assignment',
    description: '',
    date_given: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      fetchGrades();
      if (user.role === 'Lecturer') {
        fetchClasses();
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper function to normalize API responses
  const normalizeArrayResponse = (responseData) => {
    console.log('Normalizing response:', responseData);
    
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.grades)) {
      return responseData.grades;
    } else if (responseData && Array.isArray(responseData.classes)) {
      return responseData.classes;
    } else if (responseData && Array.isArray(responseData.students)) {
      return responseData.students;
    } else if (responseData && responseData.success && Array.isArray(responseData.data)) {
      return responseData.data;
    } else {
      console.warn('Unexpected response format:', responseData);
      return [];
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching grades...');
      
      const response = await gradesAPI.getGrades();
      console.log('Grades API response:', response);
      
      const gradesData = normalizeArrayResponse(response.data);
      console.log('Normalized grades data:', gradesData);
      
      setGrades(gradesData);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setError('Failed to load grades: ' + (error.response?.data?.error || error.message));
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes for lecturer...');
      const response = await classesAPI.getClasses();
      console.log('Classes API response:', response);
      
      const classesData = normalizeArrayResponse(response.data);
      console.log('Normalized classes data:', classesData);
      
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(prev => prev ? `${prev} | Classes: ${error.message}` : `Failed to load classes: ${error.message}`);
      setClasses([]);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      console.log('Fetching students for class:', classId);

      // Fetch students enrolled in the class
      const response = await classesAPI.getClassStudents(classId);
      const studentsData = response.data || [];

      console.log('Students data:', studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(prev => prev ? `${prev} | Students: ${error.message}` : `Failed to load students: ${error.message}`);
      setStudents([]);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setFormData({ ...formData, class_id: classId, student_id: '' });
    if (classId) {
      fetchStudents(classId);
    } else {
      setStudents([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Submitting grade:', formData);
      await gradesAPI.submitGrade(formData);
      
      setSuccess('Grade submitted successfully!');
      setShowForm(false);
      setFormData({
        student_id: '',
        class_id: '',
        grade: '',
        grade_type: 'assignment',
        description: '',
        date_given: new Date().toISOString().split('T')[0]
      });
      setSelectedClass('');
      setStudents([]);
      
      fetchGrades();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error submitting grade:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to submit grade';
      setError(`Submission failed: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getGradeColor = (grade) => {
    const numericGrade = parseInt(grade);
    if (numericGrade >= 80) return 'text-success';
    if (numericGrade >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getGradeBadge = (grade) => {
    const numericGrade = parseInt(grade);
    if (numericGrade >= 80) return 'bg-success';
    if (numericGrade >= 60) return 'bg-warning';
    return 'bg-danger';
  };

  // Safe arrays to prevent errors
  const safeGrades = Array.isArray(grades) ? grades : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeStudents = Array.isArray(students) ? students : [];

  console.log('Grades component state:', {
    user: user?.username,
    role: user?.role,
    gradesCount: safeGrades.length,
    classesCount: safeClasses.length,
    studentsCount: safeStudents.length,
    loading,
    submitting,
    error,
    success
  });

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view this page.</h4>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-grow-1">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading grades...</span>
      </div>
    );
  }

  return (
    <div className="grades-page h-100">
      {/* Debug Info */}
      <div className="alert alert-info mb-3">
        <small>
          <strong>Debug Info:</strong> 
          User: {user?.username} | 
          Role: {user?.role} | 
          Grades: {safeGrades.length} | 
          Classes: {safeClasses.length}
        </small>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchGrades}
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
          <h1 className="h4">Grades</h1>
          <p className="text-muted mb-0">
            {user.role === 'Lecturer' ? 'Manage student grades' : 'View your academic grades'}
          </p>
        </div>
        {user.role === 'Lecturer' && (
          <button
            className="btn btn-dark"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <><i className="bi bi-x-circle me-1"></i> Cancel</>
            ) : (
              <><i className="bi bi-plus-circle me-1"></i> Add Grade</>
            )}
          </button>
        )}
      </div>

      {showForm && user.role === 'Lecturer' && (
        <div className="card mb-3 border-0 shadow-sm">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Add New Grade</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Class</label>
                  <select
                    className="form-select"
                    value={formData.class_id}
                    onChange={(e) => handleClassChange(e.target.value)}
                    required
                  >
                    <option value="">Select Class</option>
                    {safeClasses.map(cls => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.class_name} - {cls.course_name}
                      </option>
                    ))}
                  </select>
                  {safeClasses.length === 0 && (
                    <small className="text-danger">No classes available</small>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Student</label>
                  <select
                    className="form-select"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                    disabled={!selectedClass || safeStudents.length === 0}
                  >
                    <option value="">Select Student</option>
                    {safeStudents.map(student => (
                      <option key={student.user_id} value={student.user_id}>
                        {student.full_name} ({student.username})
                      </option>
                    ))}
                  </select>
                  {selectedClass && safeStudents.length === 0 && (
                    <small className="text-danger">No students enrolled in this class</small>
                  )}
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Grade (0-100)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Grade Type</label>
                  <select
                    className="form-select"
                    value={formData.grade_type}
                    onChange={(e) => setFormData({ ...formData, grade_type: e.target.value })}
                    required
                  >
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="quiz">Quiz</option>
                    <option value="project">Project</option>
                    <option value="participation">Participation</option>
                    <option value="homework">Homework</option>
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Date Given</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date_given}
                    onChange={(e) => setFormData({ ...formData, date_given: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Grade Status</label>
                  <div className="form-control bg-light">
                    {formData.grade ? (
                      <span className={`badge ${getGradeBadge(formData.grade)}`}>
                        {formData.grade >= 80 ? 'Excellent' : formData.grade >= 60 ? 'Good' : 'Needs Improvement'}
                      </span>
                    ) : (
                      <span className="text-muted">Enter grade</span>
                    )}
                  </div>
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Description / Comments</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add comments about this grade..."
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-dark"
                disabled={submitting || !formData.class_id || !formData.student_id || !formData.grade}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i> Submit Grade
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {user.role === 'Lecturer' ? 'Grades Given' : 'My Grades'}
          </h5>
          <span className="badge bg-dark">{safeGrades.length} grades</span>
        </div>
        <div className="card-body p-0">
          {safeGrades.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard-x display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Grades Found</h4>
              <p className="text-muted">
                {user.role === 'Lecturer' 
                  ? 'You haven\'t submitted any grades yet.' 
                  : 'No grades have been assigned to you yet.'
                }
              </p>
              {user.role === 'Lecturer' && !showForm && (
                <button 
                  className="btn btn-dark btn-sm mt-2"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add First Grade
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    {user.role === 'Lecturer' ? (
                      <>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Course</th>
                      </>
                    ) : (
                      <>
                        <th>Class</th>
                        <th>Course</th>
                        <th>Lecturer</th>
                      </>
                    )}
                    <th>Grade</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {safeGrades.map((grade) => (
                    <tr key={grade.grade_id}>
                      {user.role === 'Lecturer' ? (
                        <>
                          <td>
                            <strong>{grade.student_name}</strong>
                            {grade.student_email && (
                              <small className="d-block text-muted">{grade.student_email}</small>
                            )}
                          </td>
                          <td>{grade.class_name}</td>
                          <td>
                            <div>{grade.course_name}</div>
                            <small className="text-muted">{grade.course_code}</small>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{grade.class_name}</td>
                          <td>
                            <div>{grade.course_name}</div>
                            <small className="text-muted">{grade.course_code}</small>
                          </td>
                          <td>{grade.lecturer_name}</td>
                        </>
                      )}
                      <td>
                        <span className={`fw-bold ${getGradeColor(grade.grade)}`}>
                          {grade.grade}%
                        </span>
                        <div>
                          <span className={`badge ${getGradeBadge(grade.grade)}`}>
                            {grade.grade >= 80 ? 'A' : grade.grade >= 60 ? 'B' : 'C'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary text-capitalize">
                          {grade.grade_type}
                        </span>
                      </td>
                      <td>
                        {new Date(grade.date_given).toLocaleDateString()}
                        <div>
                          <small className="text-muted">
                            {new Date(grade.date_given).toLocaleDateString() !== new Date().toLocaleDateString() && 
                              `${Math.floor((new Date() - new Date(grade.date_given)) / (1000 * 60 * 60 * 24))}d ago`
                            }
                          </small>
                        </div>
                      </td>
                      <td>
                        {grade.description || (
                          <span className="text-muted">No description</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Grades;