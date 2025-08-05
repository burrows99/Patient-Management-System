// /controllers/patientController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserByInviteToken, updateUser } from '../db/users.js';
import { JWT_SECRET } from '../middlewares/auth.js';

export async function registerPatient(req, res) {
  try {
    const { inviteToken, password } = req.body; // Get token from query params or body
    if (!inviteToken) {
      return res.status(400).json({ error: 'Invite token is required' });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        error: 'Password is required and must be at least 8 characters long' 
      });
    }

    const user = await findUserByInviteToken(inviteToken);

    if (!user || user.role !== 'patient' || user.status !== 'invited') {
      console.warn(`registerPatient: Invalid or expired invite token`);
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    if (new Date() > user.inviteTokenExpiry) {
      console.info(`registerPatient: Invite token expired for ${user.email}`);
      return res.status(400).json({ error: 'Invite token expired' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await updateUser({
      id: user.id,
      passwordHash,
      status: 'active',
      isVerified: true,
      inviteToken: null, // Clear the invite token
      inviteTokenExpiry: null, // Clear the expiry
      resetToken: null,
      resetTokenExpiry: null
    });

    if (!updatedUser) {
      console.error(`registerPatient: Failed to update user ${user.email}`);
      return res.status(500).json({ error: 'Failed to complete patient registration' });
    }

    res.status(201).json({ message: 'Patient registration successful. You can now login.' });
  } catch (error) {
    console.error(`registerPatient: Error registering patient: ${error.message}`);
    res.status(500).json({ error: 'Failed to register patient' });
  }
}

export async function loginPatient(req, res) {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      console.warn('loginPatient: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log(`loginPatient: Attempting login for patient ${email}`);
    
    // Find user by email
    const user = await findUserByEmail(email);
    
    // Check if user exists and is a patient
    if (!user || user.role !== 'patient') {
      console.warn(`loginPatient: Invalid login attempt for email: ${email} - User not found or not a patient`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (user.status !== 'active') {
      console.warn(`loginPatient: Login attempt for inactive/blocked account: ${email}, status: ${user.status}`);
      return res.status(403).json({ 
        error: 'Account is not active. Please contact support.' 
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      console.warn(`loginPatient: Invalid password attempt for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: 'patient',
        email: user.email
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '1h',
        issuer: 'nhs-patient-portal',
        subject: user.id
      }
    );

    console.log(`loginPatient: Successful login for patient ${email}`);
    
    // Return token and minimal user info
    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error(`loginPatient: Error during login: ${error.message}`, error);
    res.status(500).json({ 
      error: 'An error occurred during login. Please try again later.' 
    });
  }
}
