import React from 'react';
import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';

function App() {
  const { user, logout } = useAuth();
  return (
    <BrowserRouter>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Patient Management</Typography>
          {user ? (
            <>
              <Typography sx={{ mr: 2 }}>{user.email} ({user.role})</Typography>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">Login</Button>
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 3 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/doctor" element={user?.role === 'doctor' ? <DoctorDashboard /> : <Navigate to="/login" />} />
          <Route path="/patient" element={user?.role === 'patient' ? <PatientDashboard /> : <Navigate to="/login" />} />
          <Route path="/verify" element={<LoginPage mode="verify" />} />
          <Route path="/patient-login" element={<LoginPage mode="patient" />} />
          <Route path="*" element={<Navigate to={user ? (user.role === 'doctor' ? '/doctor' : '/patient') : '/login'} />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
