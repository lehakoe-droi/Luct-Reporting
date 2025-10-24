import React, { useState, useEffect, useMemo } from 'react';
import { analyticsAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const [stats, setStats] = useState({});
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Helper function to normalize API responses
  const normalizeStatsResponse = (responseData) => {
    console.log('Normalizing dashboard response:', responseData);
    
    if (responseData && typeof responseData === 'object') {
      // If response has data property
      if (responseData.data && typeof responseData.data === 'object') {
        return responseData.data;
      }
      // If response is the stats object directly
      return responseData;
    }
    
    console.warn('Unexpected dashboard response format:', responseData);
    return {};
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard data...');
      
      const response = await analyticsAPI.getDashboardStats();
      console.log('Dashboard API response:', response);
      
      const statsData = normalizeStatsResponse(response.data);
      console.log('Normalized stats data:', statsData);
      
      setStats(statsData);

      // Attendance trends will be fetched from API when available
      setAttendanceTrends([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data: ' + (error.response?.data?.error || error.message));
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // Safe stats with defaults
  const safeStats = {
    users: stats.users || 0,
    courses: stats.courses || 0,
    classes: stats.classes || 0,
    reports: stats.reports || 0,
    total_reports: stats.total_reports || 0,
    pending_feedback: stats.pending_feedback || 0,
    ...stats
  };

  // Role-specific content
  const roleContent = useMemo(() => {
    switch (user?.role) {
      case 'Student':
        return {
          title: 'Student Dashboard',
          description: 'Monitor your class progress, attendance, and academic performance.',
          charts: renderStudentCharts()
        };
      case 'Lecturer':
        return {
          title: 'Lecturer Dashboard',
          description: 'Track your teaching activities, student attendance, and report submissions.',
          charts: renderLecturerCharts()
        };
      case 'Principal Lecturer':
        return {
          title: 'Principal Lecturer Dashboard',
          description: 'Oversee faculty courses, monitor reports, and provide feedback to lecturers.',
          charts: renderPRLCharts()
        };
      case 'Program Leader':
        return {
          title: 'Program Leader Dashboard',
          description: 'Manage courses, assign lecturers, and monitor overall program performance.',
          charts: renderPLCharts()
        };
      default:
        return { title: 'Dashboard', description: 'Welcome to LUCT Reporting System', charts: null };
    }
  }, [user?.role]);

  // Quick actions
  const quickActions = useMemo(() => {
    switch (user?.role) {
      case 'Student':
        return [
          { label: 'View Classes', link: '/classes', icon: 'bi-book' },
          { label: 'Check Reports', link: '/reports', icon: 'bi-clipboard' },
          { label: 'Rate Lecturers', link: '/ratings', icon: 'bi-star' },
          { label: 'My Progress', link: '/monitoring', icon: 'bi-graph-up' }
        ];
      case 'Lecturer':
        return [
          { label: 'Submit Report', link: '/reports', icon: 'bi-plus-circle' },
          { label: 'My Classes', link: '/classes', icon: 'bi-book' },
          { label: 'View Ratings', link: '/ratings', icon: 'bi-star' },
          { label: 'Monitoring', link: '/monitoring', icon: 'bi-graph-up' }
        ];
      case 'Principal Lecturer':
        return [
          { label: 'Review Reports', link: '/reports', icon: 'bi-clipboard-check' },
          { label: 'View Courses', link: '/courses', icon: 'bi-journal' },
          { label: 'Monitoring', link: '/monitoring', icon: 'bi-graph-up' },
          { label: 'Classes', link: '/classes', icon: 'bi-book' }
        ];
      case 'Program Leader':
        return [
          { label: 'Manage Courses', link: '/courses', icon: 'bi-journal-plus' },
          { label: 'View Reports', link: '/reports', icon: 'bi-clipboard' },
          { label: 'Manage Lecturers', link: '/lecturers', icon: 'bi-people' },
          { label: 'Monitoring', link: '/monitoring', icon: 'bi-graph-up' }
        ];
      default:
        return [];
    }
  }, [user?.role]);

  console.log('Dashboard component state:', {
    user: user?.username,
    role: user?.role,
    stats: safeStats,
    loading,
    error
  });

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view the dashboard.</h4>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard h-100">
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

        {/* Skeleton Statistics Cards */}
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
        <div className="row flex-grow-1 mb-3" style={{ minHeight: '400px' }}>
          <div className="col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-light">
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
          <div className="col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-light">
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

        {/* Skeleton Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header py-2 bg-dark text-white">
                <small>Quick Actions</small>
              </div>
              <div className="card-body py-3">
                <div className="row">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="col-md-3 col-sm-6 mb-2">
                      <div className="placeholder-glow">
                        <span className="placeholder w-100" style={{ height: '40px' }}></span>
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

  // Statistics cards data
  const statCards = [
    { key: 'users', label: 'Total Users', value: safeStats.users, icon: 'bi-people' },
    { key: 'courses', label: 'Total Courses', value: safeStats.courses, icon: 'bi-journal' },
    { key: 'classes', label: 'Total Classes', value: safeStats.classes, icon: 'bi-book' },
    { key: 'reports', label: 'Total Reports', value: safeStats.reports, icon: 'bi-clipboard' }
  ];

  return (
    <div className="dashboard h-100">


      {error && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchDashboardData}
          >
            Retry
          </button>
        </div>
      )}

      <div className="row mb-3">
        <div className="col-12">
          <h1 className="h3 mb-1">{roleContent.title}</h1>
          <p className="text-muted mb-2">{roleContent.description}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-3">
        {statCards.map((stat) => (
          <div key={stat.key} className="col-md-3 col-sm-6 mb-2">
            <div className="card stats-card h-100 border-0 shadow-sm">
              <div className="card-body p-3 text-center">
                <div className="mb-2">
                  <i className={`bi ${stat.icon} display-6 text-dark`}></i>
                </div>
                <div className="stats-number h3 mb-1 text-dark">{stat.value}</div>
                <div className="stats-label text-muted small">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row flex-grow-1 mb-3" style={{ minHeight: '400px' }}>
        {roleContent.charts}
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header py-2 bg-dark text-white">
              <small>Quick Actions</small>
            </div>
            <div className="card-body py-3">
              <div className="row">
                {quickActions.map((action, index) => (
                  <div key={index} className="col-md-3 col-sm-6 mb-2">
                    <a 
                      href={action.link} 
                      className="btn btn-outline-dark w-100 py-2 d-flex align-items-center justify-content-center"
                    >
                      <i className={`bi ${action.icon} me-2`}></i>
                      <span>{action.label}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Chart render functions
  function renderStudentCharts() {
    return (
      <>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Attendance Progress</strong>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="attendance_rate" 
                    stroke="#000" 
                    fill="#333" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Performance Overview</strong>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { subject: 'Programming', score: 85 },
                  { subject: 'Database', score: 78 },
                  { subject: 'Networking', score: 92 },
                  { subject: 'Web Dev', score: 88 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderLecturerCharts() {
    return (
      <>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Recent Reports</strong>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { week: 'Week 1', reports: 2 },
                  { week: 'Week 2', reports: 3 },
                  { week: 'Week 3', reports: 1 },
                  { week: 'Week 4', reports: 4 },
                  { week: 'Week 5', reports: 2 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reports" fill="#000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Report Status</strong>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Submitted', value: safeStats.total_reports || 0 },
                      { name: 'Pending', value: Math.max(10 - (safeStats.total_reports || 0), 0) }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#000" />
                    <Cell fill="#6c757d" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderPRLCharts() {
    return (
      <>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Faculty Performance</strong>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { lecturer: 'Dr. Smith', reports: 15, attendance: 85 },
                  { lecturer: 'Prof. Johnson', reports: 12, attendance: 78 },
                  { lecturer: 'Dr. Williams', reports: 18, attendance: 92 },
                  { lecturer: 'Ms. Brown', reports: 10, attendance: 88 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="lecturer" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reports" fill="#000" name="Reports Submitted" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attendance" fill="#6c757d" name="Avg Attendance %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Feedback Status</strong>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Reviewed', value: 25 },
                      { name: 'Pending', value: safeStats.pending_feedback || 5 }
                    ]}
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    dataKey="value" 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#000" />
                    <Cell fill="#6c757d" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderPLCharts() {
    return (
      <div className="col-12 mb-3">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light">
            <strong>Program Overview</strong>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={[
                { course: 'Object-Oriented Programming', students: 150, attendance: 88, satisfaction: 4.2 },
                { course: 'Database Systems', students: 120, attendance: 85, satisfaction: 4.4 },
                { course: 'Computer Networking', students: 100, attendance: 82, satisfaction: 4.1 },
                { course: 'Web Development', students: 180, attendance: 90, satisfaction: 4.6 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="course" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#000" name="Enrolled Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" fill="#495057" name="Attendance %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="satisfaction" fill="#6c757d" name="Satisfaction (/5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }
};

export default Dashboard;