// /routers/prescription.js
import { Router } from 'express';
import {
  createPrescription,
  getPrescriptionsByDoctor,
  getPrescriptionsByPatient,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getAllPrescriptions
} from '../controllers/prescription.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All prescription routes require authentication
router.use(authenticate);

// Create a new prescription
router.post('/', createPrescription);

// Get all prescriptions (admin/overview)
router.get('/', getAllPrescriptions);

// Get prescriptions by doctor ID
router.get('/doctor/:doctorId', getPrescriptionsByDoctor);

// Get prescriptions by patient ID
router.get('/patient/:patientId', getPrescriptionsByPatient);

// Get a specific prescription by ID
router.get('/:id', getPrescriptionById);

// Update a prescription
router.put('/:id', updatePrescription);

// Delete a prescription
router.delete('/:id', deletePrescription);

export default router;
