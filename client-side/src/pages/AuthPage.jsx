import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authApi, saveAuthData } from '../utils/authApi';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import loginBusImage from '../assets/login_bus.png';
import './AuthPage.css';

const AuthPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleInputChange = (form, field, value) => {
    if (form === 'login') {
      setLoginForm(prev => ({ ...prev, [field]: value }));
    } else {
      setRegisterForm(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear general error
    if (error) setError('');
  };

  const validateForm = (formData, isLogin = false) => {
    const errors = {};
    
    if (!isLogin && !formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  const handleSubmit = async (e, isLogin = false) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const formData = isLogin ? loginForm : registerForm;
    const errors = validateForm(formData, isLogin);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    dispatch(loginStart());

    try {
      let response;
      if (isLogin) {
        response = await authApi.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        response = await authApi.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
      }

      if (response.success) {
        // Save to localStorage
        saveAuthData(response.data);
        
        // Save to Redux store
        const { userLoggedIn, accessToken, refreshToken } = response.data;
        dispatch(loginSuccess({
          user: userLoggedIn,
          accessToken: accessToken,
          refreshToken: refreshToken
        }));
        
        setSuccess(isLogin ? 'Login successful!' : 'Account created successfully!');
        
        // Clear forms
        if (isLogin) {
          setLoginForm({ email: '', password: '' });
        } else {
          setRegisterForm({ username: '', email: '', password: '' });
        }
        
        // Here you can add redirect logic later
        console.log('Auth successful, redirect user...', response.data);
      }
    } catch (err) {
      dispatch(loginFailure());
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Image Panel */}
        <div className="auth-image-panel">
          <img 
            src={loginBusImage} 
            alt="Bus tracking illustration" 
            className="auth-main-image"
          />
        </div>

        {/* Right Side - Auth Form */}
        <div className="auth-form-panel">
          <div className="auth-form-container">
            <div className="auth-header">
              <h1>Welcome Back</h1>
              <p>Please sign in to your account or create a new one</p>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => switchTab('login')}
              >
                Sign In
              </button>
              <button
                className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => switchTab('register')}
              >
                Create Account
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && <div className="message error-message">{error}</div>}
            {success && <div className="message success-message">{success}</div>}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={(e) => handleSubmit(e, true)} className="auth-form">
                <div className="form-group">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => handleInputChange('login', 'email', e.target.value)}
                    placeholder="Enter your email"
                    className={fieldErrors.email ? 'error' : ''}
                  />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => handleInputChange('login', 'password', e.target.value)}
                    placeholder="Enter your password"
                    className={fieldErrors.password ? 'error' : ''}
                  />
                  {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                </div>

                <div className="form-footer">
                  <a href="#" className="forgot-password">Forgot password?</a>
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading-spinner"></span> : 'Sign In'}
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={(e) => handleSubmit(e, false)} className="auth-form">
                <div className="form-group">
                  <label htmlFor="register-username">Username</label>
                  <input
                    id="register-username"
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => handleInputChange('register', 'username', e.target.value)}
                    placeholder="Choose a username"
                    className={fieldErrors.username ? 'error' : ''}
                  />
                  {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => handleInputChange('register', 'email', e.target.value)}
                    placeholder="Enter your email"
                    className={fieldErrors.email ? 'error' : ''}
                  />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="register-password">Password</label>
                  <input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => handleInputChange('register', 'password', e.target.value)}
                    placeholder="Create a password (min. 6 characters)"
                    className={fieldErrors.password ? 'error' : ''}
                  />
                  {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading-spinner"></span> : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;