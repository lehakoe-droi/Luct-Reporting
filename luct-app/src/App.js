import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Courses from './pages/Courses';
import Classes from './pages/Classes';
import Enrollments from './pages/Enrollments';
import Lecturers from './pages/Lecturers';
import Monitoring from './pages/Monitoring';
import Ratings from './pages/Ratings';
import Grades from './pages/Grades';

// Styles
import './styles/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading...</span>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You don't have permission to access this page.</p>
          <p><small>Required roles: {allowedRoles.join(', ')}</small></p>
        </div>
      </div>
    );
  }
  
  return children;
};

const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <div className="page-content">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-content">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading application...</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/" /> : 
          <AuthLayout>
            <Login />
          </AuthLayout>
        } 
      />
      <Route 
        path="/register" 
        element={
          user ? <Navigate to="/" /> :
          <AuthLayout>
            <Register />
          </AuthLayout>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <RoleBasedRoute allowedRoles={['Lecturer', 'Principal Lecturer', 'Program Leader']}>
                <Reports />
              </RoleBasedRoute>
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <RoleBasedRoute allowedRoles={['Program Leader', 'Lecturer', 'Principal Lecturer', 'Student']}>
                <Courses />
              </RoleBasedRoute>
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/classes" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Classes />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/enrollments" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <RoleBasedRoute allowedRoles={['Student']}>
                <Enrollments />
              </RoleBasedRoute>
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/lecturers" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <RoleBasedRoute allowedRoles={['Program Leader']}>
                <Lecturers />
              </RoleBasedRoute>
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grades" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <RoleBasedRoute allowedRoles={['Lecturer', 'Student', 'Principal Lecturer', 'Program Leader']}>
                <Grades />
              </RoleBasedRoute>
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/monitoring" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Monitoring />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ratings" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <RoleBasedRoute allowedRoles={['Student', 'Lecturer', 'Principal Lecturer', 'Program Leader']}>
                <Ratings />
              </RoleBasedRoute>
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;