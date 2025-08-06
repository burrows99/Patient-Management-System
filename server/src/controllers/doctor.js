// /controllers/doctorController.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import { addUser, findUserByEmail, findUserByVerificationToken, updateUser } from '../db/users.js';
import { JWT_SECRET } from '../middlewares/auth.js';
import jwt from 'jsonwebtoken';
import { getFullUrl } from '../utils/environment.js';

export async function registerDoctor(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.warn(`registerDoctor: Missing email or password`);
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
    console.info(`registerDoctor: Attempt to register existing email: ${email}`);
    return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const addedUser = await addUser({ email, passwordHash, role: 'doctor', isVerified: false, verificationToken, status: 'pending_verification' });
    
    const verificationLink = getFullUrl(`/api/doctor/verify?token=${verificationToken}`);

    const sentEmail = await sendEmail(email, 'Verify your doctor account', `Click to verify your email: ${verificationLink}`);

    if (!sentEmail?.accepted?.includes(email)) {
      console.error(`registerDoctor: Email sending failed for ${email}`);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    console.log(`registerDoctor: Successfully registered doctor with email ${email}, id ${addedUser.id}`);
    res.status(201).json({ 
      message: 'Registration successful. Check your email for verification link.',
      verificationLink,
    });
  } catch (error) {
    console.error(`registerDoctor: Error registering doctor: ${error.message}`);
    res.status(500).json({ error: 'Failed to register doctor' });
  }
}

export async function verifyDoctorEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) {
      console.warn('verifyDoctorEmail: Missing verification token');
      return res.status(400).send('Invalid verification link');
    }

    const user = await findUserByVerificationToken(token);
    if (!user) {
      console.info(`verifyDoctorEmail: No user found for token ${token}`);
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    if (user.role !== 'doctor') {
      console.warn(`verifyDoctorEmail: User with token ${token} is not a doctor`);
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    if (user.isVerified) {
      console.info(`verifyDoctorEmail: User ${user.email} already verified`);
      return res.status(400).json({ error: 'Email already verified' });
    }

    console.log('Before update - User:', JSON.stringify(user.get({ plain: true }), null, 2));
    
    const updateData = {
      id: user.id,
      isVerified: true,
      status: 'active',
      verificationToken: null
    };
    
    const updatedUser = await updateUser(updateData);
    
    if (!updatedUser) {
      console.error('verifyDoctorEmail: Failed to update user verification status');
      return res.status(500).json({ error: 'Failed to complete verification' });
    }
    
    console.log('After update - User:', JSON.stringify(updatedUser.get({ plain: true }), null, 2));
    
    console.log(`verifyDoctorEmail: User ${user.email} successfully verified`);
    res.status(200).json({ message: 'Email verified! You can now login.' });
  } catch (error) {
    console.error(`verifyDoctorEmail: Error verifying email: ${error.message}`);
    res.status(500).json({ error: 'Failed to verify email' });
  }
}

export async function loginDoctor(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.warn(`loginDoctor: Missing email or password`);
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await findUserByEmail(email);
    if (!user || user?.role !== 'doctor') {
      console.warn(`loginDoctor: Invalid credentials for email ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user?.isVerified) {
      console.warn(`loginDoctor: Email not verified for email ${email}`);
      return res.status(403).json({ error: 'Email not verified' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      console.warn(`loginDoctor: Invalid credentials for email ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(`loginDoctor: Error logging in doctor: ${error.message}`);
    res.status(500).json({ error: 'Failed to login doctor' });
  }
}

export async function invitePatient(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      console.warn('invitePatient: Missing patient email');
      return res.status(400).json({ error: 'Patient email is required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.info(`invitePatient: Attempt to invite already registered email ${email}`);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const inviteToken = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create a patient in the users table
    const invitedUser = await addUser({
      email,
      passwordHash: null, // No password set yet for invited users
      role: 'patient',
      status: 'invited',
      isVerified: false,
      verificationToken: null,
      inviteToken: inviteToken,
      inviteTokenExpiry: expiresAt,
      invitedBy: req.user.id // Track which doctor sent the invite
    });

    if (!invitedUser) {
      console.error(`invitePatient: Failed to create invited patient for ${email}`);
      return res.status(500).json({ error: 'Failed to create patient invite' });
    }

    const inviteLink = `${process.env.BASE_URL}/patient/register?token=${inviteToken}`;
    const sentEmail = await sendEmail(
      email,
      'You are invited to register as a patient',
      `You've been invited to join the NHS Patient Portal by your doctor.
      
Please complete your registration by clicking the link below:
${inviteLink}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.`
    );

    if (!sentEmail?.accepted?.includes(email)) {
      console.error(`invitePatient: Failed to send invite email to ${email}`);
      return res.status(500).json({ error: 'Failed to send invite email' });
    }

    console.log(`invitePatient: Patient invite created for ${email} by doctor ${req.user.id}`);
    res.status(200).json({
      message: 'Patient invited successfully',
      inviteToken,
    });

  } catch (error) {
    console.error(`invitePatient: Error inviting patient: ${error.message}`);
    res.status(500).json({ error: 'Failed to invite patient' });
  }
}
