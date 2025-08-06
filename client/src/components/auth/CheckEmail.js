import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  const handleBackToLogin = () => {
    navigate('/doctor/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <EmailIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            Check Your Email
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            We've sent a verification link to <strong>{email}</strong>.
            Please check your inbox and click on the link to verify your email address.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            If you don't see the email, please check your spam folder.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBackToLogin}
            sx={{ mt: 2 }}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default CheckEmail;
