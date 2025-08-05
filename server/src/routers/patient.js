// /routes/patientRoutes.js
import express from 'express';
import { registerPatient, loginPatient } from '../controllers/patient.js';

const router = express.Router();

router.post('/register', registerPatient);
router.post('/login', loginPatient);

export default router;
