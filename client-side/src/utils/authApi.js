const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const authApi = {
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
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
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
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

export const saveAuthData = (authData) => {
  // Backend returns: { userLoggedIn, accessToken, refreshToken }
  const { userLoggedIn, accessToken, refreshToken } = authData;
  
  // Save to localStorage for persistence
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(userLoggedIn));
};

export const getAuthData = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = localStorage.getItem('user');
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: user ? JSON.parse(user) : null
  };
};

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};