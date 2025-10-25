import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../services/api';

const Monitoring = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const [monitoringData, setMonitoringData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to normalize API responses
  const normalizeMonitoringResponse = useCallback((responseData) => {
    console.log('Normalizing monitoring response:', responseData);
    
    if (responseData && typeof responseData === 'object') {
      return {
        monitoringData: Array.isArray(responseData.monitoringData) ? responseData.monitoringData : [],
        attendanceData: Array.isArray(responseData.attendanceData) ? responseData.attendanceData : [],
        stats: Array.isArray(responseData.stats) ? responseData.stats : []
      };
    }
    
    console.warn('Unexpected monitoring response format:', responseData);
    return { monitoringData: [], attendanceData: [], stats: [] };
  }, []);

  // Generate fallback data based on user role
  const getFallbackData = useCallback(() => {
    if (!user) return { monitoringData: [], attendanceData: [], stats: [] };

    const fallbackStats = [
      { label: 'Overall Progress', value: '0%', icon: 'bi-graph-up' },
      { label: 'Attendance Rate', value: '0%', icon: 'bi-people' },
      { label: 'Completed Tasks', value: '0', icon: 'bi-check-circle' },
      { label: 'Current Score', value: '0.0', icon: 'bi-award' }
    ];

    const fallbackMonitoring = [
      { date: 'Mon', attendance: 0, progress: 0 },
      { date: 'Tue', attendance: 0, progress: 0 },
      { date: 'Wed', attendance: 0, progress: 0 },
      { date: 'Thu', attendance: 0, progress: 0 },
      { date: 'Fri', attendance: 0, progress: 0 }
    ];

    const fallbackAttendance = [
      { subject: 'No Data', attendance: 100 }
    ];

    return {
      monitoringData: fallbackMonitoring,
      attendanceData: fallbackAttendance,
      stats: fallbackStats
    };
  }, [user]);

  const fetchMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching monitoring data...');
      
      const response = await analyticsAPI.getMonitoringDashboard();
      console.log('Monitoring API response:', response);
      
      const normalizedData = normalizeMonitoringResponse(response.data);
      console.log('Normalized monitoring data:', normalizedData);
      
      setMonitoringData(normalizedData.monitoringData);
      setAttendanceData(normalizedData.attendanceData);
      setStats(normalizedData.stats);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setError('Failed to load monitoring data: ' + (error.response?.data?.error || error.message));
      
      // Set fallback empty data
      setMonitoringData([]);
      setAttendanceData([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeMonitoringResponse]);

  useEffect(() => {
    if (user) {
      fetchMonitoringData();
    }
  }, [user, timeRange, fetchMonitoringData]); // Added fetchMonitoringData to dependencies

  const getChartTitle = useMemo(() => {
    if (!user) return '';
    switch (user.role) {
      case 'Student': return 'Weekly Progress';
      case 'Lecturer': return 'Weekly Activities';
      case 'Principal Lecturer': return 'Lecturer Performance';
      case 'Program Leader': return 'Course Overview';
      default: return 'Monitoring Data';
    }
  }, [user]);

  // Safe arrays to prevent errors
  const safeMonitoringData = Array.isArray(monitoringData) ? monitoringData : [];
  const safeAttendanceData = Array.isArray(attendanceData) ? attendanceData : [];
  const safeStats = Array.isArray(stats) ? stats : [];

  // Use fallback data if no real data
  const displayData = safeMonitoringData.length > 0 ? 
    { monitoringData: safeMonitoringData, attendanceData: safeAttendanceData, stats: safeStats } : 
    getFallbackData();

  console.log('Monitoring component state:', {
    user: user?.username,
    role: user?.role,
    monitoringDataCount: safeMonitoringData.length,
    attendanceDataCount: safeAttendanceData.length,
    statsCount: safeStats.length,
    loading,
    error,
    usingFallback: safeMonitoringData.length === 0
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
      <div className="monitoring-page h-100">
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

        {/* Skeleton Stats */}
        <div className="row mb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-md-3 col-sm-6 mb-2">
              <div className="card stats-card h-100 border-0 shadow-sm">
                <div className="card-body p-3 text-center">
                  <div className="placeholder-glow mb-2">
                    <span className="placeholder" style={{ width: '3rem', height: '3rem', borderRadius: '50%' }}></span>
                  </div>
                  <div className="placeholder-glow mb-1">
                    <span className="placeholder col-6"></span>
                  </div>
                  <div className="placeholder-glow">
                    <span className="placeholder col-8"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="row flex-grow-1 mb-3 g-2">
          <div className="col-md-8">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-light py-2">
                <div className="placeholder-glow">
                  <span className="placeholder col-4"></span>
                </div>
              </div>
              <div className="card-body">
                <div className="placeholder-glow">
                  <span className="placeholder" style={{ width: '100%', height: '300px' }}></span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-light py-2">
                <div className="placeholder-glow">
                  <span className="placeholder col-4"></span>
                </div>
              </div>
              <div className="card-body">
                <div className="placeholder-glow">
                  <span className="placeholder" style={{ width: '100%', height: '300px' }}></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Activities */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light py-2">
                <div className="placeholder-glow">
                  <span className="placeholder col-3"></span>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="list-group-item py-2">
                      <div className="placeholder-glow">
                        <span className="placeholder col-8"></span>
                      </div>
                      <div className="placeholder-glow mt-1">
                        <span className="placeholder col-3"></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-page h-100">




      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4">Monitoring Dashboard</h1>
          <p className="text-muted mb-0">
            {user.role === 'Student' ? 'Track your academic progress and attendance' :
             user.role === 'Lecturer' ? 'Monitor teaching activities and class performance' :
             user.role === 'Principal Lecturer' ? 'Oversee faculty performance and reports' :
             'Monitor program performance and course statistics'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm">
            {['week','month','year'].map(range => (
              <button 
                key={range}
                className={`btn btn-outline-dark ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button 
            className="btn btn-outline-dark btn-sm"
            onClick={fetchMonitoringData}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-3">
        {displayData.stats.map((stat, index) => (
          <div key={index} className="col-md-3 col-sm-6 mb-2">
            <div className="card stats-card h-100 border-0 shadow-sm">
              <div className="card-body p-3 text-center">
                <i className={`bi ${stat.icon} display-6 text-dark mb-2`}></i>
                <div className="stats-number h3 text-dark mb-1">{stat.value}</div>
                <div className="stats-label text-muted small">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row flex-grow-1 mb-3 g-2">
        <div className="col-md-8">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-light py-2">
              <small><strong>{getChartTitle}</strong></small>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                {user.role === 'Program Leader' ? (
                  <BarChart data={displayData.monitoringData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="course" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#000" name="Students" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendance" fill="#333" name="Attendance %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="satisfaction" fill="#666" name="Satisfaction" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : user.role === 'Principal Lecturer' ? (
                  <BarChart data={displayData.monitoringData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="lecturer" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="reports" fill="#000" name="Reports" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendance" fill="#333" name="Attendance %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="feedback" fill="#666" name="Feedback" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={displayData.monitoringData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="attendance" 
                      stroke="#000" 
                      strokeWidth={2} 
                      name="Attendance %" 
                      dot={{ fill: '#000', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={user.role === 'Student' ? 'progress' : 'reports'} 
                      stroke="#666" 
                      strokeWidth={2} 
                      name={user.role === 'Student' ? 'Progress %' : 'Reports'} 
                      dot={{ fill: '#666', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-light py-2">
              <small>
                <strong>
                  {user.role === 'Student' ? 'Subject Attendance' : 
                   user.role === 'Lecturer' ? 'Class Attendance' :
                   user.role === 'Principal Lecturer' ? 'Course Performance' : 'Faculty Performance'}
                </strong>
              </small>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={displayData.attendanceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey={user.role === 'Program Leader' ? 'performance' : 'attendance'}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {displayData.attendanceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={['#000', '#333', '#666', '#999', '#bbb', '#ddd'][index % 6]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light py-2">
              <small><strong>Recent Activities</strong></small>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <i className="bi bi-clipboard-check text-success me-2"></i>
                    <small>New report submitted for Database Systems</small>
                  </div>
                  <small className="text-muted">2 hours ago</small>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <i className="bi bi-people text-primary me-2"></i>
                    <small>Attendance recorded for Web Development class</small>
                  </div>
                  <small className="text-muted">5 hours ago</small>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <i className="bi bi-chat-left-text text-warning me-2"></i>
                    <small>Feedback provided for OOP lecture</small>
                  </div>
                  <small className="text-muted">1 day ago</small>
                </div>
                {safeMonitoringData.length === 0 && (
                  <div className="list-group-item text-center py-3">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Real activity data will appear here once available
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;