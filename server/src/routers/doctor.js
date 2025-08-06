// /routes/doctorRoutes.js
import express from 'express';
import { 
  authenticateJWT, 
  authorizeRole 
} from '../middlewares/auth.js';
import { 
  registerDoctor, 
  verifyDoctorEmail, 
  loginDoctor, 
  invitePatient,
  getPatients,
  getPatientById
} from '../controllers/doctor.js';

const router = express.Router();

// Public routes
router.post('/register', registerDoctor);
router.get('/verify', verifyDoctorEmail);
router.post('/login', loginDoctor);

// Protected routes (require authentication and doctor role)
router.use(authenticateJWT);
router.use(authorizeRole('doctor'));

// Patient management
router.post('/invite-patient', invitePatient);
router.get('/patients', getPatients);
router.get('/patients/:patientId', getPatientById);

export default router;
