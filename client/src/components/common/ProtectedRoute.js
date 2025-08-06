import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute component that handles authentication and role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} [props.requiredRole] - Required role to access the route ('doctor', 'patient', or undefined for any authenticated user)
 * @param {string} [props.redirectTo] - Path to redirect to if not authorized (defaults to '/' or role-specific login)
 * @returns {React.ReactNode} - Rendered component or redirect
 */
const ProtectedRoute = ({ children, requiredRole, redirectTo }) => {
  const { isAuthenticated, hasRole, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading indicator while checking auth status
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Store the attempted URL to redirect after login
    const from = location.pathname + location.search;
    return <Navigate to={redirectTo || `/login?from=${encodeURIComponent(from)}`} replace />;
  }

  // If role is required but user doesn't have it
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to home or specified path
    return <Navigate to={redirectTo || '/'} replace />;
  }

  // If authenticated and has required role (if any), render children
  return children;
};

export default ProtectedRoute;
