import express from 'express';
import { authenticateJWT } from '../middlewares/auth.js';
import { getCurrentUser } from '../controllers/auth.js';

const router = express.Router();

// Protected route - requires authentication
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
