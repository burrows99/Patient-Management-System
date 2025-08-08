import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
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

    const formData = {
      patientId,
      doctorId,
      content: content.trim(),
      isEditing
    };

    console.log('Submitting form with:', formData);

    try {
      if (!content.trim()) {
        const errorMsg = 'Please enter prescription content';
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (!patientId || !doctorId) {
        const errorMsg = `Missing required information. Patient ID: ${patientId}, Doctor ID: ${doctorId}`;
        console.error(errorMsg);
        setError('Missing patient or doctor information. Please try again.');
        setLoading(false);
        return;
      }

      const prescriptionData = {
        patientId,
        doctorId,
        content: content.trim(),
        status: 'ACTIVE',
        date: new Date().toISOString()
      };

      console.log('Sending prescription data:', prescriptionData);

      let response;
      if (isEditing && prescription) {
        response = await prescriptions.update(prescription.id, prescriptionData);
      } else {
        response = await prescriptions.create(prescriptionData);
      }

      if (response.success) {
        console.log('Prescription saved successfully:', response.data);
        onSubmit && onSubmit(response.data);
        onClose();
      } else {
        const errorMsg = response.message || 'Failed to save prescription';
        console.error('Server error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save prescription. Please try again.';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
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
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <div style={{ minHeight: '40vh', marginTop: '16px' }}>
          <TextEditor
            key={`prescription-editor-${open ? 'open' : 'closed'}`}
            value={content}
            onChange={setContent}
            placeholder="Enter prescription details..."
          />
        </div>
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
