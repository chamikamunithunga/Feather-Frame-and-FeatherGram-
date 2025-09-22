import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import './AuthForm.css';

const AuthForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    contactNumber: ''
  });

  // Get the return URL from location state
  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (!isLogin) {
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return false;
      }
      
      if (!formData.username) {
        setError('Username is required');
        return false;
      }

      if (formData.username.length < 3) {
        setError('Username must be at least 3 characters long');
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        setSuccess('Login successful!');
        console.log('Login successful:', result);
        
        // Navigate to the return URL after successful login
        setTimeout(() => {
          navigate(from);
        }, 1000);
      } else {
        const result = await register(formData);
        setSuccess('Registration successful! Please check your email for verification.');
        console.log('Registration successful:', result);
        
        // Optionally switch to login mode after successful registration
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
        }, 2000);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      username: '',
      contactNumber: ''
    });
  };

  return (
    <div className="auth-container">
      {/* Left Panel - Cosmic Background */}
      <div className="auth-left-panel">
        <div className="left-panel-header">
          <Link to="/" className="left-panel-logo">FeatherGram</Link>
          <div className="left-panel-title">
            <br />
            Feed your feed with feathers.
          </div>
          <div className="left-panel-subtitle">
            Feed your feed with feathers.<br />
            A sanctuary for bird stories & discoveries.
          </div>
        </div>
        
        <div className="left-panel-footer">
          <div className="left-panel-nav">
            <Link to="/about">About</Link>
            <Link to="/services">Services</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="left-panel-indicators">
            <div className="indicator active"></div>
            <div className="indicator"></div>
            <div className="indicator"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          <div className="auth-brand">
            <Link to="/" className="auth-brand-logo">FeatherGram</Link>
            <img src={logo} alt="Logo" className="auth-brand-logo-img" />
            <Link to="/" className="auth-brand-link">FeatherFrame</Link>
          </div>
          
          <div className="auth-header">
            <h2>{isLogin ? 'Hi Bird Lover ' : 'Create Account'}</h2>
            <p>{isLogin ? 'Welcome back to the FeatherFrame! Please sign in.' : 'Join our FeatherGram today'}</p>
          </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              {/* Row 1: First Name & Last Name */}
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Row 2: Username & Email */}
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Choose a unique username"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              {/* Row 4: Contact Number (full width) */}
              <div className="input-group">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your contact number"
                />
              </div>
            </>
          )}

          {/* Login form fields */}
          {isLogin && (
            <>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your password"
                />
              </div>
            </>
          )}

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner">
                {isLogin ? 'Signing In...' : 'Signing Up...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={toggleMode} className="toggle-btn">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 