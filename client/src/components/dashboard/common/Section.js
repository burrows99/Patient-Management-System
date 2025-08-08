import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  IconButton,
  Tooltip,
  styled 
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { nhsColors } from './DashboardLayout';

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: 0,
  borderRadius: '4px',
  borderLeft: `4px solid ${nhsColors.blue}`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  backgroundColor: nhsColors.white,
  marginBottom: theme.spacing(4),
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(3, 3, 2, 3),
  borderBottom: `1px solid ${nhsColors.lightBlue}`,
}));

const SectionTitle = styled(Typography)({
  color: nhsColors.blue,
  fontWeight: 600,
  fontSize: '1.25rem',
  lineHeight: 1.4,
  margin: 0,
});

const SectionContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  '& > *:last-child': {
    marginBottom: 0,
  },
}));

/**
 * Section - A consistent section container for dashboard content with NHS styling
 * Follows SRP by handling only section styling and layout
 * Follows OCP by being extensible through children and props
 */
const Section = ({ 
  title, 
  children, 
  actions,
  info,
  noPadding = false,
  elevation = 1,
  sx = {}
}) => {
  return (
    <StyledPaper elevation={elevation} sx={sx}>
      {(title || actions) && (
        <SectionHeader>
          {title && (
            <SectionTitle variant="h6">
              {title}
              {info && (
                <Tooltip title={info} arrow>
                  <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </SectionTitle>
          )}
          {actions && <Box>{actions}</Box>}
        </SectionHeader>
      )}
      <SectionContent sx={{ p: noPadding ? 0 : 3 }}>
        {children}
      </SectionContent>
    </StyledPaper>
  );
};

export default Section;
