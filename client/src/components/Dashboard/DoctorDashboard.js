import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  TextField, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api, { doctorApi } from '../../services/api';

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

const DoctorDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch doctor's profile
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
    };

    fetchData();
  }, []);

  const handleInvitePatient = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      await doctorApi.invitePatient(email);
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      // Refresh the patient list
      const data = await doctorApi.getPatients();
      setPatients(data);
    } catch (error) {
      setError('Failed to send invitation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : !doctor ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Doctor profile not found
          </Alert>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome, Dr. {doctor.lastName || 'Doctor'}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {doctor.specialization || 'General Practitioner'}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="error"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <SectionCard title="Your Profile">
                  <InfoRow label="Name" value={`${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()} />
                  <InfoRow label="Email" value={doctor.email} />
                  <InfoRow label="Specialization" value={doctor.specialization} />
                  <InfoRow label="License Number" value={doctor.licenseNumber} />
                  <InfoRow label="Phone" value={doctor.phoneNumber} />
                  <InfoRow label="Member Since" value={formatDate(doctor.createdAt)} />
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={8}>
                <SectionCard title="Invite New Patient">
                  <form onSubmit={handleInvitePatient}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={9}>
                        <TextField
                          fullWidth
                          variant="outlined"
                          type="email"
                          label="Patient's Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Button 
                          fullWidth 
                          type="submit" 
                          variant="contained" 
                          color="primary"
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Send Invite'}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </SectionCard>

                <SectionCard title="Your Patients">
                  {patients.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Invited On</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {patients.map((patient) => (
                            <TableRow key={patient._id}>
                              <TableCell>{patient.name || 'N/A'}</TableCell>
                              <TableCell>{patient.email}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={patient.status === 'accepted' ? 'Active' : 'Pending'}
                                  color={patient.status === 'accepted' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{new Date(patient.invitedAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {patient.status === 'accepted' && (
                                  <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={() => handleViewPatient(patient._id)}
                                  >
                                    View Profile
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                      No patients found. Invite patients to get started.
                    </Typography>
                  )}
                </SectionCard>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      {/* Snackbar for error messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar for success messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DoctorDashboard;
