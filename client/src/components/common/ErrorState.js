import React from 'react';
import { Container, Alert, Button } from '@mui/material';

/**
 * ErrorState Component - Reusable error display with optional retry
 * Follows SRP: Single responsibility of displaying error states
 * Follows OCP: Extensible through onRetry prop
 */
const ErrorState = ({ 
  error, 
  onRetry,
  maxWidth = "md",
  severity = "error",
  retryText = "Try Again"
}) => (
  <Container maxWidth={maxWidth} sx={{ mt: 4 }}>
    <Alert 
      severity={severity}
      action={onRetry && (
        <Button color="inherit" size="small" onClick={onRetry}>
          {retryText}
        </Button>
      )}
    >
      {error}
    </Alert>
  </Container>
);

export default ErrorState;
