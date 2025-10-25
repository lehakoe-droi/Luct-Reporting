import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, classesAPI } from '../services/api';
import ReportForm from '../components/reports/ReportForm';

const Reports = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [classFilter, setClassFilter] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper function to normalize API responses
  const normalizeArrayResponse = useCallback((responseData) => {
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.reports)) {
      return responseData.reports;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    } else if (responseData && responseData.success && Array.isArray(responseData.reports)) {
      return responseData.reports;
    } else {
      console.warn('Unexpected reports response format:', responseData);
      return [];
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      console.log('Fetching classes for reports...');
      const response = await classesAPI.getClasses();
      console.log('Classes API response:', response);

      const classesData = normalizeArrayResponse(response.data);
      console.log('Normalized classes data:', classesData);

      setClasses(classesData);
      return classesData;
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(prev => prev ? `${prev} | Classes: ${error.message}` : `Failed to load classes: ${error.message}`);
      setClasses([]);
      throw error;
    }
  }, [normalizeArrayResponse]);

  const fetchReports = useCallback(async () => {
    try {
      console.log('Fetching reports...');

      const response = await reportsAPI.getReports();
      console.log('Reports API response:', response);

      const reportsData = normalizeArrayResponse(response.data);
      console.log('Normalized reports data:', reportsData);

      setReports(reportsData);
      return reportsData;
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports: ' + (error.response?.data?.error || error.message));
      setReports([]);
      throw error;
    }
  }, [normalizeArrayResponse]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchReports(), fetchClasses()]);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchReports, fetchClasses]);

  useEffect(() => {
    if (user && !dataLoaded) {
      loadData();
    }
  }, [user, dataLoaded, loadData]); // Added loadData to dependencies

  const handleSubmitFeedback = async (reportId) => {
    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting feedback for report:', reportId);
      await reportsAPI.addFeedback(reportId, feedback);
      
      setSuccess('Feedback submitted successfully!');
      setFeedback('');
      setSelectedReport(null);
      setShowFeedbackModal(false);
      
      fetchReports();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to submit feedback';
      setError(`Feedback submission failed: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await reportsAPI.deleteReport(reportId);
        setSuccess('Report deleted successfully!');
        fetchReports();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error deleting report:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Failed to delete report';
        alert(`Delete failed: ${errorMsg}`);
      }
    }
  };

  const getAttendancePercentage = (report) => {
    if (report.actual_students_present && report.total_registered_students) {
      const percentage = (report.actual_students_present / report.total_registered_students) * 100;
      return percentage.toFixed(1);
    }
    return 'N/A';
  };

  const getAttendanceBadgeColor = (report) => {
    const percentage = getAttendancePercentage(report);
    if (percentage === 'N/A') return 'bg-secondary';
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-danger';
  };

  const getStatusBadges = (report) => {
    const badges = [];
    
    if (report.feedback_id || report.feedback_comments) {
      badges.push(<span key="reviewed" className="badge bg-success me-1">Reviewed</span>);
    } else {
      badges.push(<span key="pending" className="badge bg-warning me-1">Pending Review</span>);
    }
    
    return badges;
  };

  // Safe array to prevent errors
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeClasses = Array.isArray(classes) ? classes : [];

  console.log('Reports component state:', {
    user: user?.username,
    role: user?.role,
    reportsCount: safeReports.length,
    classesCount: safeClasses.length,
    loading,
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
        <span className="ms-2">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="reports-page h-100">
      {/* Debug Info */}
      <div className="alert alert-info mb-3">
        <small>
          <strong>Debug Info:</strong> 
          User: {user?.username} | 
          Role: {user?.role} | 
          Reports: {safeReports.length}
        </small>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchReports}
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
          <h1 className="h4">Reports</h1>
          <p className="text-muted mb-0">
            {user.role === 'Lecturer' ? 'Manage your teaching reports' : 
             user.role === 'Principal Lecturer' ? 'Review and provide feedback on reports' :
             'View teaching reports and progress'}
          </p>
        </div>
        {user.role === 'Lecturer' && (
          <button 
            className="btn btn-dark btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {showForm ? 'Cancel' : 'New Report'}
          </button>
        )}
      </div>

      {showForm && user.role === 'Lecturer' && (
        <div className="card mb-3 border-0 shadow-sm">
          <div className="card-header bg-dark text-white py-2">
            <small>Submit New Report</small>
          </div>
          <div className="card-body p-3">
            <ReportForm 
              onSubmit={() => {
                setShowForm(false);
                fetchReports();
              }} 
            />
          </div>
        </div>
      )}

      <div className="card flex-grow-1 border-0 shadow-sm">
        <div className="card-header bg-light py-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small><strong>Reports List</strong></small>
            <span className="badge bg-dark">{safeReports.length} reports</span>
          </div>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label small mb-1">Filter by Class:</label>
              <select
                className="form-select form-select-sm"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {safeClasses.map(cls => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name} - {cls.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {safeReports.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Course</th>
                    <th>Topic</th>
                    <th>Attendance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeReports
                    .filter(report => !classFilter || report.class_id === parseInt(classFilter))
                    .map((report) => (
                    <tr key={report.report_id}>
                      <td>
                        {report.date_of_lecture ? (
                          new Date(report.date_of_lecture).toLocaleDateString()
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </td>
                      <td>
                        <strong>{report.class_name}</strong>
                      </td>
                      <td>
                        <div>{report.course_name}</div>
                        <small className="text-muted">{report.course_code}</small>
                      </td>
                      <td>
                        <div className="text-truncate" style={{maxWidth: '200px'}} title={report.topic_taught}>
                          {report.topic_taught || 'No topic specified'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getAttendanceBadgeColor(report)}`}>
                          {getAttendancePercentage(report)}%
                        </span>
                        {report.actual_students_present && report.total_registered_students && (
                          <small className="d-block text-muted">
                            {report.actual_students_present}/{report.total_registered_students}
                          </small>
                        )}
                      </td>
                      <td>
                        {getStatusBadges(report)}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => setSelectedReport(report)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {user.role === 'Principal Lecturer' && !report.feedback_id && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowFeedbackModal(true);
                              }}
                              title="Add Feedback"
                            >
                              <i className="bi bi-chat-left-text"></i>
                            </button>
                          )}
                          {user.role === 'Principal Lecturer' && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteReport(report.report_id)}
                              title="Delete Report"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-clipboard display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Reports Found</h4>
              <p className="text-muted">
                {user.role === 'Lecturer' 
                  ? 'You haven\'t submitted any reports yet.' 
                  : user.role === 'Principal Lecturer'
                  ? 'No reports available for review.'
                  : 'No reports have been submitted yet.'
                }
              </p>
              {user.role === 'Lecturer' && !showForm && (
                <button 
                  className="btn btn-dark btn-sm mt-2"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Submit First Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Report Details</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedReport(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Date of Lecture:</strong> {selectedReport.date_of_lecture ? new Date(selectedReport.date_of_lecture).toLocaleDateString() : 'Not specified'}</p>
                    <p><strong>Class:</strong> {selectedReport.class_name}</p>
                    <p><strong>Course:</strong> {selectedReport.course_name} ({selectedReport.course_code})</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Week of Reporting:</strong> {selectedReport.week_of_reporting || 'Not specified'}</p>
                    <p><strong>Attendance:</strong> {selectedReport.actual_students_present || 0} / {selectedReport.total_registered_students || 0} students</p>
                    <p><strong>Lecturer:</strong> {selectedReport.lecturer_name}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <strong>Topic Taught:</strong>
                  <p className="mb-2">{selectedReport.topic_taught || 'No topic specified'}</p>
                </div>
                
                <div className="mb-3">
                  <strong>Learning Outcomes:</strong>
                  <p className="mb-2">{selectedReport.learning_outcomes || 'No learning outcomes specified'}</p>
                </div>
                
                <div className="mb-3">
                  <strong>Recommendations:</strong>
                  <p className="mb-2">{selectedReport.recommendations || 'No recommendations provided'}</p>
                </div>
                
                {selectedReport.feedback_comments && (
                  <>
                    <hr />
                    <div className="mb-3">
                      <strong className="text-success">Feedback:</strong>
                      <p className="mb-0">{selectedReport.feedback_comments}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedReport && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  Add Feedback - {selectedReport.topic_taught || 'Untitled Report'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedback('');
                    setSelectedReport(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Feedback Comments</strong>
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Provide constructive feedback about this report..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={submitting}
                  ></textarea>
                  <small className="text-muted">
                    Your feedback will be visible to the lecturer.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedback('');
                    setSelectedReport(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-dark"
                  onClick={() => handleSubmitFeedback(selectedReport.report_id)}
                  disabled={!feedback.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;