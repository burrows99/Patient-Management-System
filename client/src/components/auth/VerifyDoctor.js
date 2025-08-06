import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { auth } from '../../services/api';
const { verifyDoctorEmail } = auth;

const VerifyDoctor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No verification token provided');
        setLoading(false);
        return;
      }

      try {
        const response = await verifyDoctorEmail(token);
        setMessage(response.message || 'Your email has been verified successfully!');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to verify email. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate('/login/doctor');
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
      p={2}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
            <Typography variant="h6">{message}</Typography>
          </Box>
        ) : error ? (
          <Box>
            <Typography color="error" variant="h6" gutterBottom>
              Verification Failed
            </Typography>
            <Typography color="textSecondary" paragraph>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleGoToLogin}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" color="primary" gutterBottom>
              Email Verified Successfully!
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              {message}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGoToLogin}
              fullWidth
              sx={{ mt: 3 }}
            >
              Proceed to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyDoctor;
