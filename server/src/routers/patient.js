// /routes/patientRoutes.js
import express from 'express';
import { 
  loginPatient,
  getPatientProfile 
} from '../controllers/patient.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', loginPatient);

// Protected routes (require authentication)
router.use(authenticateJWT);
router.get('/profile', getPatientProfile);

export default router;
