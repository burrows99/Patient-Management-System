import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * NotificationSnackbar Component - Reusable notification display
 * Follows SRP: Single responsibility of showing notifications
 * Follows OCP: Extensible through props
 */
const NotificationSnackbar = ({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' }
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
