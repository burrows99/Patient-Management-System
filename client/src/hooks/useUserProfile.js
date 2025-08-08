import { useState, useEffect, useCallback } from 'react';
import api, { doctorApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for user profile data management
 * Follows SRP: Single responsibility of managing user profile state
 * Follows DIP: Abstracts API dependencies behind a clean interface
 */
const useUserProfile = (patientId = null) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (patientId && currentUser?.role === 'doctor') {
        response = await doctorApi.getPatientById(patientId);
      } else {
        response = await api.get('/api/auth/me');
      }
      
      setProfile(response.data || response);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [patientId, currentUser?.role]);

  const retry = () => {
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    retry,
    refetch: fetchProfile
  };
};

export default useUserProfile;
