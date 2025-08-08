import React from 'react';
import { TextField, Button, Grid } from '@mui/material';
import SectionCard from '../../common/SectionCard';

/**
 * PatientInviteCard Component - Handles patient invitation form
 * Follows SRP: Single responsibility of patient invitation UI
 * Follows ISP: Only depends on the props it needs for invitation
 */
const PatientInviteCard = ({
  inviteEmail,
  setInviteEmail,
  onInvite,
  loading = false,
  title = "Invite New Patient"
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onInvite();
  };

  return (
    <SectionCard title={title}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={9}>
            <TextField
              fullWidth
              label="Patient Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter patient's email address"
              disabled={loading}
              required
            />
          </Grid>
          <Grid item xs={3}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !inviteEmail.trim()}
              sx={{ height: '56px' }}
            >
              {loading ? 'Inviting...' : 'Invite'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </SectionCard>
  );
};

export default PatientInviteCard;
