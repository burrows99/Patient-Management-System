import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

/**
 * SectionCard Component - Reusable card container with title
 * Follows SRP: Single responsibility of providing consistent card layout
 * Follows OCP: Open for extension through children and props
 */
const SectionCard = ({ 
  title, 
  children, 
  variant = "outlined",
  sx = {},
  titleVariant = "h6",
  titleComponent = "h2"
}) => (
  <Card variant={variant} sx={{ mb: 3, ...sx }}>
    <CardContent>
      {title && (
        <Typography variant={titleVariant} component={titleComponent} gutterBottom>
          {title}
        </Typography>
      )}
      {children}
    </CardContent>
  </Card>
);

export default SectionCard;
