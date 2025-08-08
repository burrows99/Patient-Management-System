import { useState, useEffect, useCallback } from 'react';
import api, { doctorApi } from '../services/api';

/**
 * Custom hook for doctor dashboard data management
 * Follows SRP: Single responsibility of managing doctor and patients data
 * Follows DIP: Abstracts API dependencies behind a clean interface
 */
const useDoctorData = () => {
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch doctor's profile and patients in parallel
      const [profileResponse, patientsResponse] = await Promise.all([
        api.get('/api/auth/me'),
        doctorApi.getPatients().catch(err => {
          console.error('Failed to fetch patients:', err);
          return [];
        })
      ]);
      
      setDoctor(profileResponse.data);
      setPatients(patientsResponse || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const invitePatient = useCallback(async () => {
    if (!inviteEmail.trim()) {
      setSnackbar({ 
        open: true, 
        message: 'Please enter a valid email address', 
        severity: 'error' 
      });
      return;
    }

    try {
      setInviteLoading(true);
      await doctorApi.invitePatient(inviteEmail);
      
      setSnackbar({ 
        open: true, 
        message: 'Patient invitation sent successfully!', 
        severity: 'success' 
      });
      setInviteEmail('');
      
      // Refresh patients list
      await fetchData();
    } catch (error) {
      console.error('Failed to invite patient:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to send invitation. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setInviteLoading(false);
    }
  }, [inviteEmail, fetchData]);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
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
    retry: fetchData,
    refetch: fetchData
  };
};

export default useDoctorData;
