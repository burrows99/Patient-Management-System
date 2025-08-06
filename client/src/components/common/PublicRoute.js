import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

/**
 * PublicRoute component that redirects authenticated users away from public routes like login/register
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 * @returns {React.ReactNode} - Rendered component or redirect
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Wait for auth to be initialized
  useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  // Show loading indicator while checking auth status
  if (loading || !isInitialized) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authenticated, redirect to the appropriate dashboard
  if (isAuthenticated && currentUser) {
    const dashboardPath = currentUser.role === 'doctor' 
      ? '/doctor/dashboard' 
      : '/patient/dashboard';
    
    // Prevent redirect loop if we're already on the dashboard
    if (location.pathname !== dashboardPath) {
      return <Navigate to={dashboardPath} replace />;
    }
  }

  // If not authenticated, render the public route
  return children;
};

export default PublicRoute;
