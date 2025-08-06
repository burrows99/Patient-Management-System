import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import api from '../../services/api';

const Dashboard = ({ userType }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      } catch (err) {
        setError('Failed to fetch user data');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Welcome, {user?.name || 'User'}
          </Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            {userType === 'doctor' ? 'Doctor' : 'Patient'} Dashboard
          </Typography>
          
          {userType === 'doctor' ? (
            <Box>
              <Typography>Specialization: {user?.specialization || 'Not specified'}</Typography>
              <Typography>Email: {user?.email}</Typography>
              {/* Add more doctor-specific content here */}
            </Box>
          ) : (
            <Box>
              <Typography>Date of Birth: {user?.dateOfBirth || 'Not specified'}</Typography>
              <Typography>Email: {user?.email}</Typography>
              {/* Add more patient-specific content here */}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;
