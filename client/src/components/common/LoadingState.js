import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingState Component - Reusable loading indicator
 * Follows SRP: Single responsibility of showing loading state
 */
const LoadingState = ({ 
  message = "Loading...", 
  size = 40,
  minHeight = "60vh",
  showMessage = false 
}) => (
  <Box 
    display="flex" 
    flexDirection="column"
    justifyContent="center" 
    alignItems="center" 
    minHeight={minHeight}
    gap={2}
  >
    <CircularProgress size={size} />
    {showMessage && (
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    )}
  </Box>
);

export default LoadingState;
