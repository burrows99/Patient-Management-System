import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import useUserProfile from '../../../hooks/useUserProfile';
import LoadingState from '../../common/LoadingState';
import ErrorState from '../../common/ErrorState';
import AccountInfoCard from '../../features/user-management/AccountInfoCard';
import ProfileSetupCard from '../../features/user-management/ProfileSetupCard';
import SimplePrescriptionList from '../../features/prescriptions/SimplePrescriptionList';

/**
 * PatientDashboard Component - Refactored following SOLID principles
 * 
 * SRP: Single responsibility of orchestrating patient dashboard layout
 * OCP: Open for extension through component composition
 * LSP: Consistent interface with other dashboard components
 * ISP: Depends only on the props it needs
 * DIP: Depends on abstractions (hooks, components) not concrete implementations
 */
const PatientDashboard = ({ patientId }) => {
  const { currentUser } = useAuth();
  const { profile, loading, error, retry } = useUserProfile(patientId);

  // Determine user role and access permissions
  const userRole = currentUser?.role || "PATIENT";
  const isDoctor = userRole === 'DOCTOR';
  const showCreateButton = isDoctor;

  if (loading) {
    return <LoadingState message="Loading patient dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isDoctor ? 'Patient Profile' : 'Patient Dashboard'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Patient Profile Section */}
        <Grid item xs={12} md={6}>
          <AccountInfoCard user={profile} title="Account Information" />
        </Grid>

        {/* Profile Setup Card */}
        <Grid item xs={12} md={6}>
          <ProfileSetupCard />
        </Grid>

        {/* Prescriptions Section */}
        <Grid item xs={12}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {isDoctor ? 'Patient Prescriptions' : 'My Prescriptions'}
            </Typography>
            <SimplePrescriptionList 
              patientId={patientId || profile?.id}
              doctorId={isDoctor ? currentUser?.id : null}
              showCreateButton={showCreateButton}
              userRole={userRole}
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PatientDashboard;
