import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Tabs, 
  Tab, 
  Alert, 
  Link,
  CircularProgress,
  Typography
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../services/api';

const DoctorAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const result = await login(formData.email, formData.password, 'doctor');
        if (result.success) {
          navigate('/doctor/dashboard');
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
      } else {
        // Handle registration
        await auth.registerDoctor({
          email: formData.email,
          password: formData.password
        });
        setShowVerificationMessage(true);
        setRegisteredEmail(formData.email);
        setFormData({
          email: '',
          password: ''
        });
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and register forms
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  if (showVerificationMessage) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 4,
          textAlign: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%' }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Check Your Email
          </Typography>
          <Typography variant="body1" paragraph>
            We've sent a verification link to <strong>{registeredEmail}</strong>.
          </Typography>
          <Typography variant="body1" paragraph>
            Please check your inbox and click on the verification link to activate your account.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Didn't receive the email? Check your spam folder or request a new verification link.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setShowVerificationMessage(false)}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    );
  }

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
          {isLogin ? 'Doctor Login' : 'Doctor Registration'}
        </Typography>
        <Tabs
          value={isLogin ? 0 : 1}
          onChange={toggleAuthMode}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={formData.password}
            onChange={handleChange}
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
              <CircularProgress size={24} />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Register'
            )}
          </Button>

          <Box textAlign="center">
            <Link
              component={RouterLink}
              to={isLogin ? '/patient' : '/patient/register'}
              variant="body2"
            >
              {isLogin
                ? 'Are you a patient? Sign in here'
                : 'Are you a patient? Register here'}
            </Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default DoctorAuth;
