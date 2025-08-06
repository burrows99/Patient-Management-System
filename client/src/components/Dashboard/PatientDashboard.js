import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Card, 
  CardContent, 
  Grid, 
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ mb: 1 }}>
    <Typography variant="subtitle2" color="textSecondary">
      {label}:
    </Typography>
    <Typography variant="body1">
      {value || 'Not specified'}
    </Typography>
    <Divider sx={{ my: 1 }} />
  </Box>
);

const SectionCard = ({ title, children }) => (
  <Card variant="outlined" sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const PatientDashboard = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auth/me');
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Patient Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {profile ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SectionCard title="Personal Information">
              <InfoRow 
                label="Name" 
                value={`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Not specified'} 
              />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
              <InfoRow label="Phone" value={profile.phoneNumber} />
              <InfoRow label="Blood Type" value={profile.bloodType} />
            </SectionCard>

            <SectionCard title="Address">
              <InfoRow label="Address" value={profile.address} />
              <InfoRow label="City" value={profile.city} />
              <InfoRow label="State/Province" value={profile.state} />
              <InfoRow label="Postal Code" value={profile.zipCode} />
              <InfoRow label="Country" value={profile.country} />
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionCard title="Emergency Contact">
              <InfoRow label="Name" value={profile.emergencyContact} />
              <InfoRow label="Phone" value={profile.emergencyPhone} />
            </SectionCard>

            <SectionCard title="Medical Information">
              <InfoRow 
                label="Allergies" 
                value={profile.allergies || 'No known allergies'} 
              />
              <InfoRow 
                label="Current Medications" 
                value={profile.medications || 'No current medications'} 
              />
              <InfoRow 
                label="Medical Conditions" 
                value={profile.conditions || 'No medical conditions recorded'} 
              />
              {profile.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Additional Notes:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {profile.notes}
                  </Typography>
                </Box>
              )}
            </SectionCard>

            <SectionCard title="Account Information">
              <InfoRow 
                label="Member Since" 
                value={formatDate(profile.createdAt)} 
              />
              <InfoRow 
                label="Last Updated" 
                value={formatDate(profile.updatedAt)} 
              />
            </SectionCard>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">No profile information available.</Alert>
      )}
    </Container>
  );
};

export default PatientDashboard;
