import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [stats, setStats] = useState({});
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboardStats();
      setStats(response.data);

      // Mock trends until real API is added
      const mockTrends = [
        { week: 'Week 1', attendance_rate: 85 },
        { week: 'Week 2', attendance_rate: 88 },
        { week: 'Week 3', attendance_rate: 82 },
        { week: 'Week 4', attendance_rate: 90 },
        { week: 'Week 5', attendance_rate: 86 },
        { week: 'Week 6', attendance_rate: 89 },
        { week: 'Week 7', attendance_rate: 91 },
        { week: 'Week 8', attendance_rate: 88 }
      ];
      setAttendanceTrends(mockTrends);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view the dashboard.</h4>
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

  // Role-specific content
  const roleContent = (() => {
    switch (user.role) {
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
  })();

  // Quick actions
  const quickActions = (() => {
    switch (user.role) {
      case 'Student':
        return [
          { label: 'View Classes', link: '/classes', icon: 'bi-book' },
          { label: 'Check Reports', link: '/reports', icon: 'bi-clipboard' },
          { label: 'Rate Courses', link: '/ratings', icon: 'bi-star' },
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
  })();

  return (
    <div className="dashboard h-100">
      <div className="row mb-3">
        <div className="col-12">
          <h1 className="h3 mb-1">{roleContent.title}</h1>
          <p className="text-muted mb-2">{roleContent.description}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-3">
        {Object.entries(stats).slice(0, 4).map(([key, value]) => (
          <div key={key} className="col-md-3 col-sm-6 mb-2">
            <div className="card stats-card h-100">
              <div className="card-body p-3 text-center">
                <div className="stats-number" style={{ fontSize: '1.8rem' }}>{value || 0}</div>
                <div className="stats-label">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
          <div className="card">
            <div className="card-header py-2">
              <small>Quick Actions</small>
            </div>
            <div className="card-body py-2">
              <div className="row">
                {quickActions.map((action, index) => (
                  <div key={index} className="col-md-3 col-sm-6 mb-1">
                    <a href={action.link} className="btn btn-outline-dark w-100 py-1">
                      <i className={`bi ${action.icon} me-1`}></i>
                      <small>{action.label}</small>
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
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Attendance Progress</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendance_rate" stroke="#000" fill="#333" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Performance Overview</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { subject: 'Math', score: 85 },
                  { subject: 'Science', score: 78 },
                  { subject: 'English', score: 92 },
                  { subject: 'History', score: 88 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderLecturerCharts() {
    return (
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">Attendance Trends</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance_rate" stroke="#000" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">Report Distribution</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Submitted', value: stats.total_reports || 0 },
                      { name: 'Pending', value: Math.max(10 - (stats.total_reports || 0), 0) }
                    ]}
                    cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                  >
                    <Cell fill="#000" />
                    <Cell fill="#ccc" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPRLCharts() {
    return (
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Faculty Performance</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { lecturer: 'Dr. Smith', reports: 15, attendance: 85 },
                  { lecturer: 'Prof. Johnson', reports: 12, attendance: 78 },
                  { lecturer: 'Dr. Williams', reports: 18, attendance: 92 },
                  { lecturer: 'Ms. Brown', reports: 10, attendance: 88 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lecturer" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reports" fill="#000" />
                  <Bar dataKey="attendance" fill="#666" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Feedback Status</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Reviewed', value: 25 },
                      { name: 'Pending', value: stats.pending_feedback || 5 }
                    ]}
                    cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                  >
                    <Cell fill="#000" />
                    <Cell fill="#ccc" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPLCharts() {
    return (
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">Program Overview</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[
                  { course: 'OOP', students: 150, attendance: 88, satisfaction: 4.2 },
                  { course: 'Database', students: 120, attendance: 85, satisfaction: 4.4 },
                  { course: 'Networking', students: 100, attendance: 82, satisfaction: 4.1 },
                  { course: 'Web Dev', students: 180, attendance: 90, satisfaction: 4.6 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#000" />
                  <Bar dataKey="attendance" fill="#333" />
                  <Bar dataKey="satisfaction" fill="#666" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Dashboard;
