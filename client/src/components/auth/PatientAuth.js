import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Tabs, Tab, Alert } from '@mui/material';
import { auth } from '../../services/api';

// Debug: Log when component mounts and API service is available
console.log('[PatientAuth] Component mounted');
console.log('[PatientAuth] API service:', { auth });

const PatientAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dateOfBirth: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Debug effect to log component updates
  useEffect(() => {
    console.log('[PatientAuth] Component updated', {
      isLogin,
      formData,
      loading,
      error,
      success
    });
    
    return () => {
      console.log('[PatientAuth] Component unmounting');
    };
  }, [isLogin, formData, loading, error, success]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[PatientAuth] Form submitted:', formData);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (isLogin) {
        console.log('[PatientAuth] Attempting patient login...');
        response = await auth.loginPatient({
          email: formData.email,
          password: formData.password
        });
        console.log('[PatientAuth] Login response:', response);
        setSuccess('Login successful! Redirecting...');
        localStorage.setItem('token', response.token);
        localStorage.setItem('userType', 'patient');
        setTimeout(() => navigate('/dashboard/patient'), 1500);
      } else {
        console.log('[PatientAuth] Attempting patient registration...');
        response = await auth.registerPatient({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth
        });
        console.log('[PatientAuth] Registration response:', response);
        setSuccess('Registration successful! Please log in.');
        setIsLogin(true);
        setFormData({
          email: '',
          password: '',
          name: '',
          dateOfBirth: ''
        });
      }
    } catch (error) {
      console.error('[PatientAuth] Error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 2,
        backgroundColor: '#f5f5f5'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          borderRadius: 2
        }}
      >
        <Tabs
          value={isLogin ? 0 : 1}
          onChange={(e, newValue) => {
            setIsLogin(newValue === 0);
            setError(null);
            setSuccess(null);
          }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        <Typography variant="h5" component="h1" gutterBottom align="center">
          {isLogin ? 'Patient Login' : 'Patient Registration'}
        </Typography>

        {error && (
          <Alert severity="error" onClose={handleCloseAlert} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={handleCloseAlert} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                disabled={loading}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required={!isLogin}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </>
          )}
          
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </Button>

          <Box textAlign="center">
            <Button
              color="primary"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PatientAuth;
