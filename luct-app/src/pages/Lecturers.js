import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { lecturersAPI, facultiesAPI, classesAPI } from '../services/api';

// Modal Components
const LecturerProfileModal = ({ lecturer, isOpen, onClose }) => {
  if (!isOpen || !lecturer) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Lecturer Profile</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-4 text-center">
                <div className={`avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3`}
                     style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                  {lecturer.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <h5>{lecturer.full_name}</h5>
                <p className="text-muted">@{lecturer.username}</p>
              </div>
              <div className="col-md-8">
                <div className="mb-3">
                  <strong>Email:</strong> {lecturer.email}
                </div>
                {lecturer.phone && (
                  <div className="mb-3">
                    <strong>Phone:</strong> {lecturer.phone}
                  </div>
                )}
                <div className="mb-3">
                  <strong>Faculty:</strong> {lecturer.faculty_name || `Faculty ${lecturer.faculty_id}`}
                </div>
                <div className="mb-3">
                  <strong>Classes:</strong> {lecturer.class_count || 0} classes assigned
                </div>
                <div className="mb-3">
                  <strong>Status:</strong> <span className="badge bg-success">Active</span>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SendMessageModal = ({ lecturer, isOpen, onClose }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    // TODO: Implement actual message sending via API
    alert(`Message sent to ${lecturer.full_name}: ${message}`);
    setMessage('');
    onClose();
  };

  if (!isOpen || !lecturer) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Send Message to {lecturer.full_name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="messageText" className="form-label">Message</label>
              <textarea
                className="form-control"
                id="messageText"
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSend} disabled={!message.trim()}>Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewScheduleModal = ({ lecturer, isOpen, onClose, lecturerClasses, loadingClasses }) => {
  if (!isOpen || !lecturer) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Schedule for {lecturer.full_name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loadingClasses ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading schedule...</p>
              </div>
            ) : lecturerClasses.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Class Code</th>
                      <th>Course Name</th>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturerClasses.map((classItem) => (
                      <tr key={classItem.class_id}>
                        <td>{classItem.class_code}</td>
                        <td>{classItem.course_name}</td>
                        <td>{classItem.day_of_week}</td>
                        <td>{classItem.start_time} - {classItem.end_time}</td>
                        <td>{classItem.room_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="bi bi-calendar-x display-4 text-muted"></i>
                <h5 className="text-muted mt-3">No Classes Scheduled</h5>
                <p className="text-muted">
                  This lecturer has no classes assigned at the moment.
                </p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Lecturers = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const [lecturers, setLecturers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Modal states
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [lecturerClasses, setLecturerClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Ref to track if initial load has completed
  const isInitialLoadRef = useRef(true);

  // Helper function to normalize API responses
  const normalizeArrayResponse = (responseData) => {
    console.log('Normalizing lecturers response:', responseData);

    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.lecturers)) {
      return responseData.lecturers;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    } else if (responseData && responseData.success && Array.isArray(responseData.users)) {
      return responseData.users;
    } else {
      console.warn('Unexpected lecturers response format:', responseData);
      return [];
    }
  };

  const fetchLecturers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching lecturers with filters:', { debouncedSearchTerm, selectedFaculty });

      const params = {};
      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      if (selectedFaculty !== 'all') {
        params.faculty_id = selectedFaculty;
      }

      const response = await lecturersAPI.getLecturers(params);
      console.log('Lecturers API response:', response);

      const lecturersData = normalizeArrayResponse(response.data);
      console.log('Normalized lecturers data:', lecturersData);

      setLecturers(lecturersData);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      setError('Failed to load lecturers: ' + (error.response?.data?.error || error.message));
      setLecturers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, selectedFaculty]);

  const fetchFaculties = useCallback(async () => {
    try {
      const response = await facultiesAPI.getFaculties();
      const facultiesData = normalizeArrayResponse(response.data);
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  }, []);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.role === 'Program Leader') {
      fetchLecturers();
      fetchFaculties();
      isInitialLoadRef.current = false;
    } else {
      setLoading(false);
    }
  }, [user]); // Only depend on user, not the functions

  // Handle search and filter changes - only after initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isInitialLoadRef.current && user?.role === 'Program Leader' && (debouncedSearchTerm || selectedFaculty !== 'all')) {
      const timer = setTimeout(() => {
        fetchLecturers();
      }, 100); // Small delay to prevent rapid calls
      return () => clearTimeout(timer);
    }
  }, [debouncedSearchTerm, selectedFaculty, user?.role]); // Only depend on the values, not the function

  // Modal handlers
  const handleViewProfile = (lecturer) => {
    setSelectedLecturer(lecturer);
    setProfileModalOpen(true);
  };

  const handleSendMessage = (lecturer) => {
    setSelectedLecturer(lecturer);
    setMessageModalOpen(true);
  };

  const fetchLecturerClasses = useCallback(async (lecturerId) => {
    try {
      setLoadingClasses(true);
      const response = await classesAPI.getLecturerSchedule(lecturerId);
      const classesData = normalizeArrayResponse(response.data);
      setLecturerClasses(classesData);
    } catch (error) {
      console.error('Error fetching lecturer classes:', error);
      setLecturerClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const handleViewSchedule = (lecturer) => {
    setSelectedLecturer(lecturer);
    fetchLecturerClasses(lecturer.user_id);
    setScheduleModalOpen(true);
  };

  const closeModals = () => {
    setProfileModalOpen(false);
    setMessageModalOpen(false);
    setScheduleModalOpen(false);
    setSelectedLecturer(null);
  };

  // Helper function to get initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return '??';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get random color for avatar
  const getAvatarColor = (name) => {
    const colors = [
      'bg-primary', 'bg-secondary', 'bg-success', 'bg-danger', 
      'bg-warning', 'bg-info', 'bg-dark'
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  // Safe array to prevent errors
  const safeLecturers = Array.isArray(lecturers) ? lecturers : [];

  console.log('Lecturers component state:', {
    user: user?.username,
    role: user?.role,
    lecturersCount: safeLecturers.length,
    loading,
    error
  });

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view this page.</h4>
      </div>
    );
  }

  if (user.role !== 'Program Leader') {
    return (
      <div className="alert alert-danger m-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-shield-exclamation display-4 text-danger me-3"></i>
          <div>
            <h4 className="alert-heading">Access Denied</h4>
            <p className="mb-0">You do not have permission to access the lecturers management page.</p>
            <small className="text-muted">
              Current role: {user.role} | Required role: Program Leader
            </small>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-grow-1">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading lecturers...</span>
      </div>
    );
  }

  return (
    <div className="lecturers-page h-100">
      {/* Debug Info */}
      <div className="alert alert-info mb-3">
        <small>
          <strong>Debug Info:</strong> 
          Program Leader: {user?.username} | 
          Lecturers: {safeLecturers.length}
        </small>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchLecturers}
          >
            Retry
          </button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4">Lecturers Management</h1>
          <p className="text-muted mb-0">
            Manage and view all lecturers in your faculty
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-outline-dark btn-sm"
            onClick={fetchLecturers}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <span className="badge bg-dark">{safeLecturers.length} lecturers</span>
        </div>
      </div>

      {/* Quick Stats */}
      {safeLecturers.length > 0 && (
        <div className="row mb-3">
          <div className="col-md-3">
            <div className="card bg-light border-0">
              <div className="card-body text-center py-2">
                <h6 className="mb-0 text-dark">{safeLecturers.length}</h6>
                <small className="text-muted">Total Lecturers</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light border-0">
              <div className="card-body text-center py-2">
                <h6 className="mb-0 text-success">{safeLecturers.length}</h6>
                <small className="text-muted">Active</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light border-0">
              <div className="card-body text-center py-2">
                <h6 className="mb-0 text-warning">0</h6>
                <small className="text-muted">On Leave</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-light border-0">
              <div className="card-body text-center py-2">
                <h6 className="mb-0 text-info">
                  {new Set(safeLecturers.map(l => l.faculty_id)).size}
                </h6>
                <small className="text-muted">Faculties</small>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card flex-grow-1 border-0 shadow-sm">
        <div className="card-header bg-dark text-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <small>Faculty Lecturers</small>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search lecturers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{width: '200px'}}
              />
              <select
                className="form-select form-select-sm"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                style={{width: '150px'}}
              >
                <option value="all">All Faculties</option>
                {faculties.map((faculty) => (
                  <option key={faculty.faculty_id} value={faculty.faculty_id}>
                    {faculty.faculty_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {safeLecturers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Lecturer</th>
                    <th>Contact Information</th>
                    <th>Faculty</th>
                    <th>Classes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeLecturers.map((lecturer) => (
                    <tr key={lecturer.user_id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className={`avatar ${getAvatarColor(lecturer.full_name)} text-white rounded-circle d-flex align-items-center justify-content-center me-3`}
                            style={{ width: '45px', height: '45px', fontSize: '0.9rem' }}
                          >
                            {getInitials(lecturer.full_name)}
                          </div>
                          <div>
                            <strong className="d-block">{lecturer.full_name}</strong>
                            <small className="text-muted">@{lecturer.username}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div>
                            <i className="bi bi-envelope me-1 text-muted"></i>
                            {lecturer.email}
                          </div>
                          {lecturer.phone && (
                            <div>
                              <i className="bi bi-phone me-1 text-muted"></i>
                              {lecturer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-dark">
                          {lecturer.faculty_name || `Faculty ${lecturer.faculty_id}`}
                        </span>
                      </td>
                      <td>
                        <div className="text-center">
                          <span className="fw-bold text-dark">{lecturer.class_count || 0}</span>
                          <small className="d-block text-muted">classes</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i> Active
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            title="View Profile"
                            onClick={() => handleViewProfile(lecturer)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            title="Send Message"
                            onClick={() => handleSendMessage(lecturer)}
                          >
                            <i className="bi bi-chat"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            title="View Schedule"
                            onClick={() => handleViewSchedule(lecturer)}
                          >
                            <i className="bi bi-calendar"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-person-x display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Lecturers Found</h4>
              <p className="text-muted">
                There are currently no lecturers assigned to your faculty.
              </p>
              <div className="mt-3">
                <button className="btn btn-dark btn-sm me-2">
                  <i className="bi bi-person-plus me-1"></i> Add Lecturer
                </button>
                <button 
                  className="btn btn-outline-dark btn-sm"
                  onClick={fetchLecturers}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      {safeLecturers.length > 0 && (
        <div className="card border-0 bg-light mt-3">
          <div className="card-body py-2">
            <div className="row text-center">
              <div className="col-md-4">
                <small>
                  <i className="bi bi-info-circle text-primary me-1"></i>
                  <strong>Manage Access</strong> - Control lecturer permissions and access levels
                </small>
              </div>
              <div className="col-md-4">
                <small>
                  <i className="bi bi-graph-up text-primary me-1"></i>
                  <strong>Performance</strong> - Monitor teaching performance and student feedback
                </small>
              </div>
              <div className="col-md-4">
                <small>
                  <i className="bi bi-calendar-check text-primary me-1"></i>
                  <strong>Scheduling</strong> - View and manage lecturer schedules and assignments
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <LecturerProfileModal
        lecturer={selectedLecturer}
        isOpen={profileModalOpen}
        onClose={closeModals}
      />
      <SendMessageModal
        lecturer={selectedLecturer}
        isOpen={messageModalOpen}
        onClose={closeModals}
      />
      <ViewScheduleModal
        lecturer={selectedLecturer}
        isOpen={scheduleModalOpen}
        onClose={closeModals}
        lecturerClasses={lecturerClasses}
        loadingClasses={loadingClasses}
      />
    </div>
  );
};

export default Lecturers;