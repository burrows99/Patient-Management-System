import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box } from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { DefaultLayout } from '../../../layouts';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <DefaultLayout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 3,
          padding: 3,
        }}
      >
        <MedicalServicesIcon sx={{ fontSize: 80, color: 'primary.main' }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Patient Management System
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          A secure platform connecting doctors and patients for better healthcare management.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Please select your role to continue:
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, marginTop: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login/doctor')}
            sx={{ minWidth: 200 }}
          >
            I'm a Doctor
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login/patient')}
            sx={{ minWidth: 200 }}
          >
            I'm a Patient
          </Button>
        </Box>
      </Box>
    </DefaultLayout>
  );
};

export default LandingPage;
