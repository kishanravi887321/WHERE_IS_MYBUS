import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAuthData } from '../utils/authApi';

const AuthGuard = ({ children, redirectIfAuthenticated = false }) => {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (redirectIfAuthenticated) {
      // Check both Redux state and localStorage for authentication
      const authData = getAuthData();
      const isUserAuthenticated = isAuthenticated || accessToken || authData.accessToken;
      
      if (isUserAuthenticated) {
        // If user is authenticated and on landing page or auth page, redirect to home
        navigate('/home', { replace: true });
      }
    }
  }, [accessToken, isAuthenticated, navigate, redirectIfAuthenticated]);

  return children;
};

export default AuthGuard;