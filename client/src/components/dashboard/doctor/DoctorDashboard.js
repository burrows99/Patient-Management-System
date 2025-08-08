import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useDoctorData from '../../../hooks/useDoctorData';
import LoadingState from '../../common/LoadingState';
import ErrorState from '../../common/ErrorState';
import AccountInfoCard from '../../features/user-management/AccountInfoCard';
import PatientInviteCard from './PatientInviteCard';
import PatientsTable from './PatientsTable';
import NotificationSnackbar from '../../common/NotificationSnackbar';

/**
 * DoctorDashboard Component - Main dashboard for doctors
 * Refactored following SOLID principles:
 * - SRP: Single responsibility of orchestrating doctor dashboard UI
 * - OCP: Open for extension through component composition
 * - LSP: Uses consistent component interfaces
 * - ISP: Components depend only on what they need
 * - DIP: Depends on abstractions (hooks) not concrete implementations
 */
const DoctorDashboard = () => {
  const navigate = useNavigate();
  const {
    doctor,
    patients,
    loading,
    error,
    inviteEmail,
    setInviteEmail,
    inviteLoading,
    snackbar,
    invitePatient,
    closeSnackbar,
    retry
  } = useDoctorData();

  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  if (loading) {
    return <LoadingState message="Loading doctor dashboard..." />;
  }

  if (error && !doctor) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Doctor Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Doctor Profile Section */}
        <Grid item xs={12}>
          <AccountInfoCard user={doctor} title="Profile Information" />
        </Grid>

        {/* Invite Patient Section */}
        <Grid item xs={12}>
          <PatientInviteCard
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            onInvite={invitePatient}
            loading={inviteLoading}
          />
        </Grid>

        {/* Patients List Section */}
        <Grid item xs={12}>
          <Box>
            <Typography variant="h5" gutterBottom>
              My Patients ({patients.length})
            </Typography>
            <PatientsTable
              patients={patients}
              onViewProfile={handleViewPatient}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Notification Snackbar */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Container>
  );
};

export default DoctorDashboard;
