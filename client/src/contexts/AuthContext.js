import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          // Try to get user data from the server
          const user = await auth.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to fetch user from server, falling back to local storage:', error);
          // If the endpoint is not available, fall back to local storage
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setCurrentUser(parsedUser);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Failed to parse user data from local storage:', e);
            }
          }
        }

        // If we get here, we couldn't get user data from either source
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, userType) => {
    try {
      setLoading(true);
      const response = userType === 'doctor' 
        ? await auth.loginDoctor({ email, password })
        : await auth.loginPatient({ email, password });
      
      const { token, user } = response;
      localStorage.setItem('token', token);
      const userWithRole = { ...user, role: userType };
      
      // Store user data in local storage as a fallback
      localStorage.setItem('user', JSON.stringify(userWithRole));
      
      setCurrentUser(userWithRole);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    // Redirect to login page after logout
    window.location.href = '/';
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!currentUser) return false;
    if (requiredRole === 'any') return true; // For routes that require any authenticated user
    return currentUser.role === requiredRole;
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
