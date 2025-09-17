const API_BASE_URL = 'https://where-is-mybus.onrender.com/api';

export const authApi = {
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('Cannot reach server. Try again later');
      }
      throw error;
    }
  },

  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('Cannot reach server. Try again later');
      }
      throw error;
    }
  }
};

export const saveAuthData = (authData, dispatch = null) => {
  // Save to localStorage for persistence
  localStorage.setItem('accessToken', authData.accessToken);
  localStorage.setItem('user', JSON.stringify(authData.user));
  
  // Save to Redux store if dispatch is provided
  if (dispatch) {
    const { loginSuccess } = require('../store/slices/authSlice');
    dispatch(loginSuccess(authData));
  }
};

export const getAuthData = () => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  return {
    accessToken: token,
    user: user ? JSON.parse(user) : null
  };
};

export const clearAuthData = (dispatch = null) => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  
  // Clear from Redux store if dispatch is provided
  if (dispatch) {
    const { logout } = require('../store/slices/authSlice');
    dispatch(logout());
  }
};