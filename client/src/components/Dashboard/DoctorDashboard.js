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
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doctorApi } from '../../services/api';

const DoctorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await doctorApi.getPatients();
        // Assuming the API returns an object with invited and accepted patients
        setPatients(data);
      } catch (error) {
        setError('Failed to fetch patients: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Doctor Dashboard
            </Typography>
            <Typography variant="body1" gutterBottom>
              Welcome, {currentUser?.email}
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

        {/* Invite Patient Form */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Invite Patient</Typography>
          <Box component="form" onSubmit={handleInvitePatient} sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              type="email"
              label="Patient's Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
              sx={{ minWidth: 150 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Invitation'}
            </Button>
          </Box>
        </Paper>

        {/* Patients List */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Patients</Typography>
          <TableContainer>
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
                {patients.length > 0 ? (
                  patients.map((patient) => (
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
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No patients found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Snackbars for notifications */}
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
      </Box>
    </Container>
  );
};

export default DoctorDashboard;
