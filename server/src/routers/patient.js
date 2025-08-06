// /routes/patientRoutes.js
import express from 'express';
import { loginPatient } from '../controllers/patient.js';

const router = express.Router();

// Only login endpoint for patients
router.post('/login', loginPatient);

export default router;
