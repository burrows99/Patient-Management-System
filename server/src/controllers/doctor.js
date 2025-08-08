// /controllers/doctorController.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import { 
  addUser, 
  findUserByEmail, 
  findUserByVerificationToken, 
  updateUser,
  findUsersByDoctorId,
  findUserById 
} from '../db/users.js';
import { JWT_SECRET } from '../middlewares/auth.js';
import jwt from 'jsonwebtoken';
import { getFrontendUrl } from '../utils/environment.js';
import { USER_ROLES, USER_STATUS } from '../constants/user.js';

export async function registerDoctor(req, res) {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.info(`registerDoctor: Attempt to register existing email: ${email}`);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const addedUser = await addUser({
      email,
      passwordHash,
      role: USER_ROLES.DOCTOR,
      status: USER_STATUS.PENDING_VERIFICATION,
      verificationToken
    });
    
    const verificationLink = `${getFrontendUrl()}/doctor/verify?token=${verificationToken}`;

    const sentEmail = await sendEmail(
      email, 
      'Verify your doctor account', 
      `Please click the link below to verify your email address:

${verificationLink}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering as a doctor. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
        </div>
      `
    );

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

    if (user.role !== USER_ROLES.DOCTOR) {
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
      status: USER_STATUS.ACTIVE,
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
    if (!user || user?.role !== USER_ROLES.DOCTOR) {
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

/**
 * Get all patients for the current doctor
 */
export async function getPatients(req, res) {
  try {
    const doctorId = req.user.id;
    const patients = await findUsersByDoctorId(doctorId);
    
    // Format the response to include status - access dataValues from Sequelize instances
    const formattedPatients = patients.map(patient => ({
      id: patient.dataValues.id,
      email: patient.dataValues.email,
      name: patient.dataValues.name || patient.dataValues.email, // fallback to email if name doesn't exist
      status: patient.dataValues.isVerified ? 'accepted' : 'pending',
      invitedAt: patient.dataValues.createdAt,
      acceptedAt: patient.dataValues.isVerified ? patient.dataValues.updatedAt : null
    }));

    res.json(formattedPatients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
}

/**
 * Get patient details by ID
 */
export async function getPatientById(req, res) {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;
    
    // Find the patient and verify they belong to the doctor
    const patient = await findUserById(patientId);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Verify the patient was invited by the doctor
    if (patient.invitedBy !== doctorId) {
      return res.status(403).json({ error: 'Not authorized to view this patient' });
    }
    
    // Return patient details (exclude sensitive data) - convert Sequelize instance to plain object
    const patientData = {
      id: patient.dataValues.id,
      email: patient.dataValues.email,
      role: patient.dataValues.role,
      status: patient.dataValues.isVerified ? 'accepted' : 'pending',
      isVerified: patient.dataValues.isVerified,
      createdAt: patient.dataValues.createdAt,
      updatedAt: patient.dataValues.updatedAt,
      invitedBy: patient.dataValues.invitedBy
    };
    
    res.json(patientData);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
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
      role: USER_ROLES.PATIENT,
      status: USER_STATUS.INVITED,
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

    const inviteLink = `${getFrontendUrl()}/login/patient?inviteToken=${inviteToken}&email=${encodeURIComponent(email)}`;
    const sentEmail = await sendEmail(
      email,
      'You are invited to login as a patient',
      `You've been invited to join the NHS Patient Portal by your doctor.
      
Please complete your login by clicking the link below:
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
