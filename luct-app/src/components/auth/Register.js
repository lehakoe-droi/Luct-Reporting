import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    role: 'Student',
    faculty_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.faculty_id) {
      setError('Please select a faculty');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...submitData } = formData;
    const result = await register(submitData);

    if (result.success) {
      // Auto-login after successful registration
      const loginResult = await login({ username: formData.username, password: formData.password });
      if (loginResult.success) {
        navigate('/');
      } else {
        setError('Registration successful, but login failed. Please login manually.');
      }
    } else {
      setError(result.message || 'Registration failed');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Registration Successful</h2>
          </div>
          <div className="login-body text-center">
            <div className="alert alert-success">
              <i className="bi bi-check-circle-fill me-2"></i>
              Your account has been created successfully!
            </div>
            <p className="text-muted mb-3">
              You are now logged in as {formData.full_name} ({formData.role})
            </p>
            <Link to="/" className="btn btn-dark">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Create Account</h2>
          <p className="mb-0">Register for LUCT Reporting System</p>
        </div>
        <div className="login-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Full Name & Email */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="full_name" className="form-label">Full Name *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-control"
                required
                minLength="3"
              />
              <div className="form-text">Username must be at least 3 characters long</div>
            </div>

            {/* Password & Confirm */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="password" className="form-label">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  required
                  minLength="6"
                />
                <div className="form-text">Password must be at least 6 characters</div>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Role & Faculty */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="role" className="form-label">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Student">Student</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Principal Lecturer">Principal Lecturer</option>
                  <option value="Program Leader">Program Leader</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="faculty_id" className="form-label">Faculty *</label>
                <select
                  id="faculty_id"
                  name="faculty_id"
                  value={formData.faculty_id}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Faculty</option>
                  <option value="1">Faculty of Information Communication Technology</option>
                  <option value="2">Faculty of Communication and Media</option>
                  <option value="3">Faculty of Architecture and Interior</option>
                  <option value="4">Faculty of Design Innovation</option>
                  <option value="5">Faculty of Creativity in Tourism and Hospitality</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-dark w-100" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Account...
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <div className="text-center mt-3">
            <p className="mb-0">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
