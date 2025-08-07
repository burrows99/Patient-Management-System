import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DefaultLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}
          >
            Patient Management
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              },
              transition: 'all 0.3s ease',
              fontWeight: 500
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#f9f9f9' }}>
        {children}
      </Box>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: '#1a237e',
          color: 'white'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Patient Management System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default DefaultLayout;
