import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LandingPage from './components/LandingPage/LandingPage';
import DoctorAuth from './components/auth/DoctorAuth';
import PatientAuth from './components/auth/PatientAuth';
import CheckEmail from './components/auth/CheckEmail';
import Dashboard from './components/Dashboard/Dashboard';

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

// Protected Route Component
const ProtectedRoute = ({ children, requiredUserType }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token || userType !== requiredUserType) {
    // Redirect to login if not authenticated or wrong user type
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/doctor/auth" element={<DoctorAuth />} />
        <Route path="/patient/auth" element={<PatientAuth />} />
        <Route path="/check-email" element={<CheckEmail />} />
        
        {/* Protected Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredUserType="doctor">
              <Dashboard userType="doctor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredUserType="patient">
              <Dashboard userType="patient" />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
