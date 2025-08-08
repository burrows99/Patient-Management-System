import React from 'react';
import { Box, Typography } from '@mui/material';
import SectionCard from '../../common/SectionCard';

/**
 * ProfileSetupCard Component - Displays profile completion message
 * Follows SRP: Single responsibility of showing profile setup info
 */
const ProfileSetupCard = ({ 
  title = "Profile Setup",
  primaryMessage = "Complete your profile to get the most out of the system.",
  secondaryMessage = "Additional profile fields like personal information, medical history, and emergency contacts can be added in future updates."
}) => (
  <SectionCard title={title}>
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        {primaryMessage}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {secondaryMessage}
      </Typography>
    </Box>
  </SectionCard>
);

export default ProfileSetupCard;
