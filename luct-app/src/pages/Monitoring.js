import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';

const Monitoring = () => {
  const { user } = useAuth();

  const [monitoringData, setMonitoringData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMonitoringData();
  }, [user, timeRange]);

  const fetchMonitoringData = async () => {
    try {
      let data = [];
      let attendance = [];

      switch (user.role) {
        case 'Student':
          data = [
            { date: 'Mon', attendance: 85, progress: 78 },
            { date: 'Tue', attendance: 88, progress: 82 },
            { date: 'Wed', attendance: 82, progress: 85 },
            { date: 'Thu', attendance: 90, progress: 88 },
            { date: 'Fri', attendance: 86, progress: 90 }
          ];
          attendance = [
            { subject: 'OOP', attendance: 92 },
            { subject: 'Database', attendance: 85 },
            { subject: 'Web Dev', attendance: 88 },
            { subject: 'Networking', attendance: 79 }
          ];
          break;

        case 'Lecturer':
          data = [
            { date: 'Mon', attendance: 85, reports: 3, feedback: 2 },
            { date: 'Tue', attendance: 88, reports: 4, feedback: 3 },
            { date: 'Wed', attendance: 82, reports: 2, feedback: 1 },
            { date: 'Thu', attendance: 90, reports: 5, feedback: 4 },
            { date: 'Fri', attendance: 86, reports: 3, feedback: 2 }
          ];
          attendance = [
            { class: 'BScIT-OOP', attendance: 92 },
            { class: 'BScIT-DB', attendance: 85 },
            { class: 'BScSM-Web', attendance: 88 }
          ];
          break;

        case 'Principal Lecturer':
          data = [
            { lecturer: 'Dr. Smith', reports: 15, attendance: 85, feedback: 12 },
            { lecturer: 'Prof. Johnson', reports: 12, attendance: 78, feedback: 8 },
            { lecturer: 'Dr. Williams', reports: 18, attendance: 92, feedback: 15 },
            { lecturer: 'Ms. Brown', reports: 10, attendance: 88, feedback: 7 }
          ];
          attendance = [
            { course: 'OOP', attendance: 88 },
            { course: 'Database', attendance: 85 },
            { course: 'Web Dev', attendance: 90 },
            { course: 'Networking', attendance: 82 }
          ];
          break;

        case 'Program Leader':
          data = [
            { course: 'OOP', students: 150, attendance: 88, satisfaction: 4.2 },
            { course: 'Database', students: 120, attendance: 85, satisfaction: 4.4 },
            { course: 'Web Dev', students: 180, attendance: 90, satisfaction: 4.6 },
            { course: 'Networking', students: 100, attendance: 82, satisfaction: 4.1 }
          ];
          attendance = [
            { faculty: 'ICT', performance: 87 },
            { faculty: 'Communication', performance: 82 },
            { faculty: 'Architecture', performance: 85 },
            { faculty: 'Design', performance: 79 }
          ];
          break;

        default:
          data = [];
          attendance = [];
      }

      setMonitoringData(data);
      setAttendanceData(attendance);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleSpecificStats = () => {
    if (!user) return [];
    switch (user.role) {
      case 'Student':
        return [
          { label: 'Overall Attendance', value: '87%', icon: 'bi-people' },
          { label: 'Academic Progress', value: '84%', icon: 'bi-graph-up' },
          { label: 'Completed Courses', value: '8', icon: 'bi-check-circle' },
          { label: 'Current GPA', value: '3.8', icon: 'bi-award' }
        ];
      case 'Lecturer':
        return [
          { label: 'Avg Attendance', value: '87%', icon: 'bi-people' },
          { label: 'Reports Submitted', value: '17', icon: 'bi-clipboard-check' },
          { label: 'Feedback Received', value: '12', icon: 'bi-chat-left-text' },
          { label: 'Student Satisfaction', value: '4.3/5', icon: 'bi-star' }
        ];
      case 'Principal Lecturer':
        return [
          { label: 'Faculty Attendance', value: '86%', icon: 'bi-people' },
          { label: 'Total Reports', value: '55', icon: 'bi-clipboard-check' },
          { label: 'Pending Feedback', value: '8', icon: 'bi-chat-left' },
          { label: 'Lecturer Performance', value: '88%', icon: 'bi-graph-up' }
        ];
      case 'Program Leader':
        return [
          { label: 'Total Courses', value: '24', icon: 'bi-journal' },
          { label: 'Active Lecturers', value: '18', icon: 'bi-people' },
          { label: 'Program Attendance', value: '85%', icon: 'bi-clipboard-check' },
          { label: 'Overall Satisfaction', value: '4.4/5', icon: 'bi-star' }
        ];
      default:
        return [];
    }
  };

  const getChartTitle = () => {
    if (!user) return '';
    switch (user.role) {
      case 'Student': return 'Weekly Progress';
      case 'Lecturer': return 'Weekly Activities';
      case 'Principal Lecturer': return 'Lecturer Performance';
      case 'Program Leader': return 'Course Overview';
      default: return 'Monitoring Data';
    }
  };

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
      </div>
    );
  }

  return (
    <div className="monitoring-page h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">Monitoring Dashboard</h1>
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
      </div>

      {/* Stats */}
      <div className="row mb-3">
        {getRoleSpecificStats().map((stat, index) => (
          <div key={index} className="col-md-3 col-sm-6 mb-2">
            <div className="card stats-card h-100">
              <div className="card-body p-3 text-center">
                <i className={`bi ${stat.icon} display-6 text-dark mb-2`}></i>
                <div className="stats-number" style={{ fontSize: '1.8rem' }}>{stat.value}</div>
                <div className="stats-label">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row flex-grow-1 mb-3 g-2">
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header py-2"><small>{getChartTitle()}</small></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                {user.role === 'Program Leader' ? (
                  <BarChart data={monitoringData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#000" name="Students" />
                    <Bar dataKey="attendance" fill="#333" name="Attendance %" />
                    <Bar dataKey="satisfaction" fill="#666" name="Satisfaction" />
                  </BarChart>
                ) : user.role === 'Principal Lecturer' ? (
                  <BarChart data={monitoringData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lecturer" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="reports" fill="#000" name="Reports" />
                    <Bar dataKey="attendance" fill="#333" name="Attendance %" />
                    <Bar dataKey="feedback" fill="#666" name="Feedback" />
                  </BarChart>
                ) : (
                  <LineChart data={monitoringData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" stroke="#000" strokeWidth={2} name="Attendance %" />
                    <Line type="monotone" dataKey={user.role === 'Student' ? 'progress' : 'reports'} stroke="#666" strokeWidth={2} name={user.role === 'Student' ? 'Progress %' : 'Reports'} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header py-2">
              <small>
                {user.role === 'Student' ? 'Subject Attendance' : 
                 user.role === 'Lecturer' ? 'Class Attendance' :
                 user.role === 'Principal Lecturer' ? 'Course Performance' : 'Faculty Performance'}
              </small>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={user.role === 'Program Leader' ? 'performance' : 'attendance'}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#000','#333','#666','#999'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header py-2"><small>Recent Activities</small></div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <small>New report submitted for Database Systems</small>
                  <small className="text-muted">2 hours ago</small>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <small>Attendance recorded for Web Development class</small>
                  <small className="text-muted">5 hours ago</small>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <small>Feedback provided for OOP lecture</small>
                  <small className="text-muted">1 day ago</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
