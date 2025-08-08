import React from 'react';
import { Container, Grid, Typography, Box } from '@mui/material';

// NHS Color Palette
const nhsColors = {
  blue: '#005EB8',
  white: '#FFFFFF',
  black: '#212B32',
  lightBlue: '#E8EDEE',
  red: '#DA291C',
  green: '#006747',
  yellow: '#FFB81C',
};

/**
 * DashboardLayout - A reusable layout component for all dashboards with NHS styling
 * Follows SRP by handling only layout concerns
 * Follows OCP by being extensible through children
 */
const DashboardLayout = ({ 
  title, 
  children, 
  maxWidth = 'lg',
  containerSpacing = 4,
  gridSpacing = 3
}) => {
  return (
    <Box sx={{ 
      backgroundColor: nhsColors.lightBlue,
      minHeight: '100vh',
      py: 4
    }}>
      <Container 
        maxWidth={maxWidth}
        sx={{ 
          backgroundColor: nhsColors.white,
          borderRadius: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          p: 4,
          my: 2
        }}
      >
        <Box 
          sx={{ 
            borderBottom: `4px solid ${nhsColors.blue}`,
            mb: 4,
            pb: 2
          }}
        >
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              color: nhsColors.blue,
              fontWeight: 600,
              m: 0,
              fontSize: '2rem',
              lineHeight: 1.2
            }}
          >
            {title}
          </Typography>
        </Box>
        
        <Grid container spacing={gridSpacing}>
          {React.Children.map(children, (child, index) => (
            <Grid item xs={12} key={index}>
              {child}
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Attach colors to the component for easy access
DashboardLayout.nhsColors = nhsColors;

export default DashboardLayout;
export { nhsColors };
