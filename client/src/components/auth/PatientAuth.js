import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { auth } from '../../services/api';

const PatientAuth = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Set email and invite token from URL params if available
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    const inviteToken = searchParams.get('inviteToken');
    
    if (emailFromUrl) {
      setFormData(prev => ({
        ...prev,
        email: decodeURIComponent(emailFromUrl)
      }));
    }
    
    if (inviteToken) {
      console.log('Found invite token in URL:', inviteToken);
      // We'll include this in the login request
    }
  }, [searchParams]);

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
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const inviteToken = searchParams.get('inviteToken');
      const loginData = {
        email: formData.email,
        password: formData.password
      };
      
      // Include invite token if present in URL
      if (inviteToken) {
        loginData.inviteToken = inviteToken;
        console.log('Including invite token in login request');
      }
      
      const response = await auth.loginPatient(loginData);
      console.log('Login successful:', response);
      setSuccess('Login successful!');
      navigate('/patient/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password. Please try again.');
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
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Patient Login
        </Typography>

        {error && (
          <Alert severity="error" onClose={handleCloseAlert} sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={handleCloseAlert} sx={{ width: '100%', mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            fullWidth
            margin="normal"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
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
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Need an account? Please contact your doctor for an invitation.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PatientAuth;
