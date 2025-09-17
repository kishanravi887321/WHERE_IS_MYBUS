import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAuthData } from '../utils/authApi';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { accessToken, isAuthenticated } = useSelector((state) => state.auth);
  
  // Check both Redux state and localStorage for authentication
  const authData = getAuthData();
  const isUserAuthenticated = isAuthenticated || accessToken || authData.accessToken;

  if (!isUserAuthenticated) {
    // Redirect to auth page if not authenticated
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;