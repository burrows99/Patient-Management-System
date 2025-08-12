import { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import api from '../api/axios';

export default function PatientDashboard() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    api.get('/patients/me').then((res) => setMe(res.data)).catch(() => setMe(null));
  }, []);
  return (
    <Box>
      <Typography variant="h5" mb={2}>Patient Dashboard</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Your Profile</Typography>
        <pre>{JSON.stringify(me, null, 2)}</pre>
      </Paper>
    </Box>
  );
}


