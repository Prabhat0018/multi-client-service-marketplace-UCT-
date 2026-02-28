import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [userType, setUserType] = useState('customer');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (userType === 'customer') {
        response = await authAPI.userLogin(formData);
      } else {
        response = await authAPI.merchantLogin(formData);
      }

      login(response.data.token, response.data.user, userType === 'merchant' ? 'merchant' : 'customer');
      
      // Redirect based on user type
      if (userType === 'merchant') {
        navigate('/merchant/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your account</p>

        <div className="auth-tabs">
          <button 
            className={userType === 'customer' ? 'active' : ''} 
            onClick={() => setUserType('customer')}
          >
            Customer
          </button>
          <button 
            className={userType === 'merchant' ? 'active' : ''} 
            onClick={() => setUserType('merchant')}
          >
            Merchant
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="divider">
          Don't have an account? <Link to="/register" className="text-primary">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
