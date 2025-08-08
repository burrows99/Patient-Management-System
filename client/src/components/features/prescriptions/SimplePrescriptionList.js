import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Fab,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon
} from '@mui/icons-material';
import { prescriptions } from '../../../services/api';
import SimplePrescriptionForm from './SimplePrescriptionForm';

const SimplePrescriptionList = ({ 
  userId, 
  userRole, 
  patientId = null, 
  doctorId = null,
  showCreateButton = true 
}) => {
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      if (userRole === 'doctor' && patientId) {
        response = await prescriptions.getByPatient(patientId);
      } else if (userRole === 'doctor') {
        response = await prescriptions.getByDoctor(userId);
      } else {
        response = await prescriptions.getByPatient(userId);
      }
      
      if (response.success) {
        const prescriptions = Array.isArray(response.data) ? response.data : [];
        setPrescriptionList(prescriptions);
      } else {
        setError(response.message || 'Failed to fetch prescriptions');
        setPrescriptionList([]);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to fetch prescriptions');
      setPrescriptionList([]);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole, patientId]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleCreatePrescription = () => {
    setEditingPrescription(null);
    setShowForm(true);
  };

  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    setShowForm(true);
    setAnchorEl(null);
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        const response = await prescriptions.delete(prescriptionId);
        if (response.success) {
          setPrescriptionList(prev => prev.filter(p => p.id !== prescriptionId));
        } else {
          setError(response.message || 'Failed to delete prescription');
        }
      } catch (err) {
        console.error('Error deleting prescription:', err);
        setError('Failed to delete prescription');
      }
    }
    setAnchorEl(null);
  };

  const handleFormSubmit = (newPrescription) => {
    console.log('Form submitted with:', { newPrescription, patientId, doctorId });
    
    if (!patientId || !doctorId) {
      setError('Missing patient or doctor information');
      return;
    }

    if (editingPrescription) {
      setPrescriptionList(prev => 
        prev.map(p => p.id === editingPrescription.id ? newPrescription : p)
      );
    } else {
      setPrescriptionList(prev => [newPrescription, ...prev]);
    }
    setShowForm(false);
    setEditingPrescription(null);
  };

  const handleMenuClick = (event, prescription) => {
    setAnchorEl(event.currentTarget);
    setSelectedPrescription(prescription);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPrescription(null);
  };

  const filteredPrescriptions = prescriptionList.filter(prescription => {
    return prescription.content?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const truncateContent = (content, maxLength = 200) => {
    if (!content) return 'No content';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Debug logs for button visibility - using console.error to make them more visible
  const isDoctor = userRole && userRole.toUpperCase() === 'DOCTOR';
  const shouldShowButton = showCreateButton && isDoctor;
  
  console.error('=== DEBUG: SimplePrescriptionList ===');
  console.error('showCreateButton:', showCreateButton);
  console.error('userRole:', userRole);
  console.error('isDoctor:', isDoctor);
  console.error('shouldShowButton:', shouldShowButton);
  console.error('patientId:', patientId);
  console.error('userId:', userId);
  console.error('doctorId:', doctorId);
  console.error('==============================');

  return (
    <Box>
      {/* Header with Search */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" display="flex" alignItems="center">
          <PharmacyIcon sx={{ mr: 1, color: 'primary.main' }} />
          {userRole === 'doctor' && patientId ? 'Patient Prescriptions' : 'My Prescriptions'}
        </Typography>
        
        {/* Force show button for testing - remove in production */}
        {true && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePrescription}
            sx={{ borderRadius: 2 }}
          >
            New Prescription
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search prescription content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Prescriptions Grid */}
      {filteredPrescriptions.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <PharmacyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'No prescriptions match your search' : 'No prescriptions found'}
            </Typography>
            {showCreateButton && userRole?.toUpperCase() === 'DOCTOR' && !searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreatePrescription}
                sx={{ mt: 2 }}
              >
                Create First Prescription
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredPrescriptions.map((prescription) => (
            <Grid item xs={12} md={6} lg={4} key={prescription.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3">
                      Prescription
                    </Typography>
                    
                    {userRole === 'doctor' && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, prescription)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Typography 
                    variant="body2" 
                    color="text.primary" 
                    sx={{ 
                      mb: 2,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {truncateContent(prescription.content)}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                    Created: {new Date(prescription.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  {prescription.updatedAt !== prescription.createdAt && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Updated: {new Date(prescription.updatedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditPrescription(selectedPrescription)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeletePrescription(selectedPrescription?.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Floating Action Button for Mobile */}
      {showCreateButton && userRole === 'doctor' && (
        <Fab
          color="primary"
          aria-label="add prescription"
          onClick={handleCreatePrescription}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' }
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Simple Prescription Form Modal */}
      <SimplePrescriptionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        prescription={editingPrescription}
        patientId={patientId}
        doctorId={doctorId}
        onSubmit={handleFormSubmit}
        isEditing={!!editingPrescription}
      />
    </Box>
  );
};

export default SimplePrescriptionList;
