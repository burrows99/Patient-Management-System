// /routes/doctorRoutes.js
import express from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.js';
import { registerDoctor, verifyDoctorEmail, loginDoctor, invitePatient } from '../controllers/doctor.js';

const router = express.Router();

router.post('/register', registerDoctor);
router.get('/verify', verifyDoctorEmail);
router.post('/login', loginDoctor);
router.post('/invite-patient', authenticateJWT, authorizeRole('doctor'), invitePatient);

export default router;
