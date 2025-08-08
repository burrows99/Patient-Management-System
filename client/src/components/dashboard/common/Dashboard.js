import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DoctorDashboard from '../doctor/DoctorDashboard';
import PatientDashboard from '../patient/PatientDashboard';
import LoadingState from '../../common/LoadingState';

/**
 * Dashboard Component - Route-based dashboard selector
 * Follows SRP: Single responsibility of routing to appropriate dashboard
 * Follows OCP: Open for extension with new user roles
 */
const Dashboard = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!currentUser) {
    return <div>Please log in to access your dashboard.</div>;
  }

  // Route to appropriate dashboard based on user role
  switch (currentUser.role?.toUpperCase()) {
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    default:
      return <div>Unknown user role. Please contact support.</div>;
  }
};

export default Dashboard;
