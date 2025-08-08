import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  Alert
} from '@mui/material';
import { prescriptions } from '../../../services/api';
import TextEditor from '../../common/TextEditor';

const SimplePrescriptionForm = ({ 
  open,
  onClose,
  prescription = null, 
  patientId = null, 
  doctorId = null, 
  onSubmit,
  isEditing = false 
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prescription && isEditing) {
      setContent(prescription.content || '');
    } else {
      setContent('');
    }
  }, [prescription, isEditing, open]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (!content.trim()) {
        setError('Please enter prescription content');
        setLoading(false);
        return;
      }

      if (!patientId || !doctorId) {
        setError('Missing patient or doctor information');
        setLoading(false);
        return;
      }

      const prescriptionData = {
        patientId,
        doctorId,
        content: content.trim()
      };

      let response;
      if (isEditing && prescription) {
        response = await prescriptions.update(prescription.id, prescriptionData);
      } else {
        response = await prescriptions.create(prescriptionData);
      }

      if (response.success) {
        onSubmit && onSubmit(response.data);
        onClose();
      } else {
        setError(response.message || 'Failed to save prescription');
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
      setError(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          {isEditing ? 'Edit Prescription' : 'Create New Prescription'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Use the rich text editor below to write the prescription. You can format text and use OCR to extract text from images.
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <TextEditor 
            initialContent={content}
            onChange={setContent}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !content.trim()}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Prescription' : 'Create Prescription')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimplePrescriptionForm;
