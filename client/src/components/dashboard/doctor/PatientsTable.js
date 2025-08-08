import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Typography
} from '@mui/material';
import { formatDate } from '../../../utils/formatters';

/**
 * PatientsTable Component - Displays patients in a table format
 * Follows SRP: Single responsibility of displaying patients data
 * Follows OCP: Extensible through onViewProfile callback
 */
const PatientsTable = ({ 
  patients = [], 
  onViewProfile,
  emptyMessage = "No patients found. Start by inviting your first patient!"
}) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (patients.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Invited</strong></TableCell>
            <TableCell><strong>Accepted</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id} hover>
              <TableCell>{patient.email}</TableCell>
              <TableCell>
                <Chip 
                  label={patient.status} 
                  color={getStatusColor(patient.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatDate(patient.invitedAt)}</TableCell>
              <TableCell>{formatDate(patient.acceptedAt)}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onViewProfile?.(patient.id)}
                  disabled={patient.status !== 'accepted'}
                >
                  View Profile
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PatientsTable;
