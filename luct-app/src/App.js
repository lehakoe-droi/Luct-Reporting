import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
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
    <div className="auth-pages">
      {children}
      <Footer />
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <AuthLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthLayout>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/enrollments" element={<Enrollments />} />
        <Route path="/lecturers" element={<Lecturers />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </MainLayout>
  );
};

function App() {
  return (
    <>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
  </>
  );
}

export default App;