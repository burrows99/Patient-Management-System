import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export default function DoctorDashboard() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const invite = async () => {
    setMessage(null); setError(null);
    try {
      await api.post('/auth/invite', { email });
      setMessage('Invite sent');
      setEmail('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invite failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" mb={2}>Doctor Dashboard</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Invite Patient</Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack direction="row" gap={2}>
          <TextField label="Patient Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <Button variant="contained" onClick={invite} disabled={!email}>Send Invite</Button>
        </Stack>
      </Paper>
      <Typography>Welcome, {user?.email}</Typography>
    </Box>
  );
}


