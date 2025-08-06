import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage/LandingPage';
import DoctorAuth from './components/auth/DoctorAuth';
import PatientAuth from './components/auth/PatientAuth';
import CheckEmail from './components/auth/CheckEmail';
import DoctorDashboard from './components/Dashboard/DoctorDashboard';
import PatientDashboard from './components/Dashboard/PatientDashboard';
import VerifyDoctor from './components/auth/VerifyDoctor';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
  },
});

// Simple loading spinner component
const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          
          <Route path="/login/doctor" element={
            <PublicRoute>
              <DoctorAuth isLogin={true} />
            </PublicRoute>
          } />
          
          <Route path="/register/doctor" element={
            <PublicRoute>
              <DoctorAuth isLogin={false} />
            </PublicRoute>
          } />
          
          <Route path="/login/patient" element={
            <PublicRoute>
              <PatientAuth isLogin={true} />
            </PublicRoute>
          } />
          
          <Route path="/register/patient" element={
            <PublicRoute>
              <PatientAuth isLogin={false} />
            </PublicRoute>
          } />
          
          <Route path="/doctor/verify" element={
            <PublicRoute>
              <VerifyDoctor />
            </PublicRoute>
          } />
          
          <Route path="/check-email" element={
            <PublicRoute>
              <CheckEmail />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/patient/dashboard" element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          } />
          
          {/* Fallback routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="any">
              <Navigate to="/" replace />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
