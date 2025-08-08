import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

/**
 * InfoRow Component - Displays a label-value pair with consistent styling
 * Follows SRP: Single responsibility of displaying information rows
 */
const InfoRow = ({ 
  label, 
  value, 
  showDivider = true,
  labelColor = "textSecondary",
  valueColor = "textPrimary" 
}) => (
  <Box sx={{ mb: 1 }}>
    <Typography variant="subtitle2" color={labelColor}>
      {label}:
    </Typography>
    <Typography variant="body1" color={valueColor}>
      {value || 'Not specified'}
    </Typography>
    {showDivider && <Divider sx={{ my: 1 }} />}
  </Box>
);

export default InfoRow;
