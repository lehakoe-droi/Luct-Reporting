import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import ReportForm from '../components/reports/ReportForm';

const Reports = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      const response = await reportsAPI.getReports();
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSubmitFeedback = async (reportId) => {
    try {
      await reportsAPI.addFeedback(reportId, feedback);
      setFeedback('');
      setSelectedReport(null);
      setShowFeedbackModal(false);
      fetchReports();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportsAPI.deleteReport(reportId);
        fetchReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('Failed to delete report.');
      }
    }
  };

  const getAttendancePercentage = (report) => {
    return report.actual_students_present && report.total_registered_students
      ? ((report.actual_students_present / report.total_registered_students) * 100).toFixed(1)
      : 'N/A';
  };

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view this page.</h4>
      </div>
    );
  }

  return (
    <div className="reports-page h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">Reports</h1>
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
        <div className="card mb-3">
          <div className="card-header py-2">
            <small>Submit New Report</small>
          </div>
          <div className="card-body p-3">
            <ReportForm onSubmit={() => {
              setShowForm(false);
              fetchReports();
            }} />
          </div>
        </div>
      )}

      <div className="card flex-grow-1">
        <div className="card-header py-2">
          <small>Reports List</small>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
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
                {reports.map((report) => (
                  <tr key={report.report_id}>
                    <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                    <td>{report.class_name}</td>
                    <td>{report.course_name} ({report.course_code})</td>
                    <td>{report.topic_taught}</td>
                    <td>
                      <span className={`badge ${getAttendancePercentage(report) > 80 ? 'bg-success' : 'bg-warning'}`}>
                        {getAttendancePercentage(report)}%
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">Submitted</span>
                      {report.feedback_id && (
                        <span className="badge bg-success ms-1">Reviewed</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-dark me-1"
                        onClick={() => setSelectedReport(report)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {user.role === 'Principal Lecturer' && !report.feedback_id && (
                        <button
                          className="btn btn-sm btn-outline-dark me-1"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowFeedbackModal(true);
                          }}
                        >
                          <i className="bi bi-chat-left-text"></i>
                        </button>
                      )}
                      {user.role === 'Principal Lecturer' && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteReport(report.report_id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Report Details</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setSelectedReport(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Date:</strong> {new Date(selectedReport.date_of_lecture).toLocaleDateString()}</p>
                    <p><strong>Class:</strong> {selectedReport.class_name}</p>
                    <p><strong>Course:</strong> {selectedReport.course_name} ({selectedReport.course_code})</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Week:</strong> {selectedReport.week_of_reporting}</p>
                    <p><strong>Attendance:</strong> {selectedReport.actual_students_present} / {selectedReport.total_registered_students}</p>
                    <p><strong>Lecturer:</strong> {selectedReport.lecturer_name}</p>
                  </div>
                </div>
                <hr />
                <p><strong>Topic Taught:</strong> {selectedReport.topic_taught}</p>
                <p><strong>Learning Outcomes:</strong> {selectedReport.learning_outcomes}</p>
                <p><strong>Recommendations:</strong> {selectedReport.recommendations}</p>
                {selectedReport.feedback_comments && (
                  <>
                    <hr />
                    <p><strong>Feedback:</strong> {selectedReport.feedback_comments}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedReport && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Feedback for {selectedReport.topic_taught}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedback('');
                    setSelectedReport(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Enter your feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
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
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-dark"
                  onClick={() => handleSubmitFeedback(selectedReport.report_id)}
                  disabled={!feedback.trim()}
                >
                  Submit Feedback
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
