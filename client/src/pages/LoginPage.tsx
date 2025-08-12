import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography, Alert } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginPage({ mode }: { mode?: 'verify' | 'patient' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (mode === 'verify' && token) {
      api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`).then(() => setMessage('Email verified. You can login.')).catch(() => setError('Verification failed'));
    }
    if (mode === 'patient' && token) {
      api.get(`/auth/patient-login?token=${encodeURIComponent(token)}`).then((res) => {
        login(res.data.accessToken);
        navigate('/patient');
      }).catch(() => setError('Login failed'));
    }
  }, [mode, location.search, login, navigate]);

  useEffect(() => {
    if (user) navigate(user.role === 'doctor' ? '/doctor' : '/patient');
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.accessToken);
      navigate('/doctor');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={6}>
      <Paper sx={{ p: 4, width: 420 }}>
        <Typography variant="h5" mb={2}>Login</Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <Stack gap={2}>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained">Login</Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}


