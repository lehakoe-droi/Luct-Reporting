import React, { useState, useEffect, useCallback } from 'react';
import { classesAPI, reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ReportForm = ({ onSubmit }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    class_id: '',
    week_of_reporting: '',
    date_of_lecture: '',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: '',
    actual_students_present: ''
  });
  
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper function to normalize API responses
  const normalizeArrayResponse = useCallback((responseData) => {
    console.log('Normalizing classes response:', responseData);
    
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.classes)) {
      return responseData.classes;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    } else if (responseData && responseData.success && Array.isArray(responseData.classes)) {
      return responseData.classes;
    } else {
      console.warn('Unexpected classes response format:', responseData);
      return [];
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching classes for report form...');
      
      const response = await classesAPI.getClasses();
      console.log('Classes API response:', response);
      
      const classesData = normalizeArrayResponse(response.data);
      console.log('Normalized classes data:', classesData);
      
      // Filter classes to only show classes taught by the current lecturer
      const lecturerClasses = classesData.filter(cls => 
        cls.lecturer_id === user.user_id || 
        cls.lecturer_id?.toString() === user.user_id?.toString()
      );
      
      console.log('Filtered lecturer classes:', lecturerClasses);
      setClasses(lecturerClasses);
      
      if (lecturerClasses.length === 0) {
        setError('No classes assigned to you. Please contact your program leader.');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes: ' + (error.response?.data?.error || error.message));
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [user, normalizeArrayResponse]);

  useEffect(() => {
    console.log('ReportForm user:', user);
    if (user) {
      fetchClasses();
    }
  }, [user, fetchClasses]); // Added fetchClasses to dependencies

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear any previous errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a report.');
      return;
    }

    if (classes.length === 0) {
      setError('No classes available. Please contact your program leader.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Submitting report:', formData);
      
      const reportData = {
        ...formData,
        lecturer_id: user.user_id // Add logged-in user's ID
      };
      
      await reportsAPI.addReport(reportData);
      
      setSuccess('Report submitted successfully!');
      
      // Reset form
      setFormData({
        class_id: '',
        week_of_reporting: '',
        date_of_lecture: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: '',
        actual_students_present: ''
      });
      
      // Call onSubmit callback after a short delay to show success message
      setTimeout(() => {
        if (onSubmit) onSubmit();
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to submit report';
      setError(`Submission failed: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Safe array to prevent errors
  const safeClasses = Array.isArray(classes) ? classes : [];

  console.log('ReportForm state:', {
    user: user?.username,
    userId: user?.user_id,
    classesCount: safeClasses.length,
    loading,
    submitting,
    error
  });

  return (
    <form onSubmit={handleSubmit} className="report-form">
      {/* Debug Info */}
      <div className="alert alert-info mb-3">
        <small>
          <strong>Debug Info:</strong> 
          Lecturer: {user?.username} | 
          User ID: {user?.user_id} | 
          Classes: {safeClasses.length}
        </small>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div className="flex-grow-1">{error}</div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchClasses}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-1"></span>
            ) : (
              <i className="bi bi-arrow-clockwise me-1"></i>
            )}
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>{success}</div>
        </div>
      )}
      
      <div className="row">
        <div className="col-md-6">
          <div className="form-group mb-3">
            <label className="form-label">Class *</label>
            <select
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading || safeClasses.length === 0 || submitting}
            >
              <option value="">Select Class</option>
              {safeClasses.map(cls => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name} - {cls.course_name} ({cls.course_code})
                </option>
              ))}
            </select>
            {loading && (
              <div className="form-text">
                <span className="spinner-border spinner-border-sm me-1"></span>
                Loading classes...
              </div>
            )}
            {!loading && safeClasses.length === 0 && !error && (
              <div className="form-text text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                No classes assigned to you. Please contact your program leader.
              </div>
            )}
            {safeClasses.length > 0 && (
              <div className="form-text text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Showing {safeClasses.length} class(es) assigned to you
              </div>
            )}
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="form-group mb-3">
            <label className="form-label">Week of Reporting *</label>
            <input
              type="number"
              name="week_of_reporting"
              value={formData.week_of_reporting}
              onChange={handleChange}
              className="form-control"
              min="1"
              max="52"
              placeholder="e.g., 12"
              required
              disabled={submitting}
            />
            <div className="form-text text-muted">
              Academic week number (1-52)
            </div>
          </div>
        </div>
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Date of Lecture *</label>
        <input
          type="date"
          name="date_of_lecture"
          value={formData.date_of_lecture}
          onChange={handleChange}
          className="form-control"
          required
          disabled={submitting}
          max={new Date().toISOString().split('T')[0]} // Cannot select future dates
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Topic Taught *</label>
        <input
          type="text"
          name="topic_taught"
          value={formData.topic_taught}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter the main topic covered in this lecture"
          required
          disabled={submitting}
        />
        <div className="form-text text-muted">
          Be specific about the main concepts covered
        </div>
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Learning Outcomes *</label>
        <textarea
          name="learning_outcomes"
          value={formData.learning_outcomes}
          onChange={handleChange}
          className="form-control"
          rows="3"
          placeholder="Describe what students should be able to do after this lecture..."
          required
          disabled={submitting}
        />
        <div className="form-text text-muted">
          What knowledge or skills should students gain from this lecture?
        </div>
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Lecturer's Recommendations *</label>
        <textarea
          name="recommendations"
          value={formData.recommendations}
          onChange={handleChange}
          className="form-control"
          rows="3"
          placeholder="Provide recommendations for improvement, follow-up actions, or student support needed..."
          required
          disabled={submitting}
        />
        <div className="form-text text-muted">
          Suggestions for improving future sessions or addressing challenges
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">Actual Number of Students Present *</label>
        <input
          type="number"
          name="actual_students_present"
          value={formData.actual_students_present}
          onChange={handleChange}
          className="form-control"
          min="0"
          max="500"
          placeholder="Enter the number of students who attended"
          required
          disabled={submitting}
        />
        <div className="form-text text-muted">
          Count of students physically present during the lecture
        </div>
      </div>

      <div className="d-flex gap-2">
        <button 
          type="submit" 
          className="btn btn-dark flex-grow-1"
          disabled={loading || safeClasses.length === 0 || submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Submitting Report...
            </>
          ) : (
            <>
              <i className="bi bi-clipboard-check me-2"></i>
              Submit Report
            </>
          )}
        </button>
        <button 
          type="button" 
          className="btn btn-outline-secondary"
          onClick={() => onSubmit && onSubmit()}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>

      {/* Form Help Section */}
      <div className="card bg-light mt-4">
        <div className="card-body py-3">
          <h6 className="card-title mb-2">
            <i className="bi bi-lightbulb me-2"></i>
            Report Submission Tips
          </h6>
          <ul className="list-unstyled mb-0 small">
            <li><i className="bi bi-check text-success me-1"></i> Be specific and detailed in your descriptions</li>
            <li><i className="bi bi-check text-success me-1"></i> Include measurable learning outcomes</li>
            <li><i className="bi bi-check text-success me-1"></i> Provide constructive recommendations</li>
            <li><i className="bi bi-check text-success me-1"></i> Ensure attendance numbers are accurate</li>
          </ul>
        </div>
      </div>
    </form>
  );
};

export default ReportForm;