// /controllers/patientController.js
import { 
  findUserByEmail, 
  findUserByInviteToken, 
  updateUser 
} from '../db/users.js';
import { USER_ROLES, USER_STATUS } from '../constants/user.js';
import { 
  validateLoginInput,
  validateUser,
  validateInviteToken,
  hashPassword,
  verifyPassword,
  generateAuthToken,
  prepareUserResponse
} from '../utils/authUtils.js';

export async function registerPatient(req, res) {
  try {
    const { inviteToken, password } = req.body;
    
    // Validate required fields
    if (!inviteToken) {
      return res.status(400).json({ error: 'Invite token is required' });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        error: 'Password is required and must be at least 8 characters long' 
      });
    }

    // Find user by invite token
    const user = await findUserByInviteToken(inviteToken);

    if (!user || user.role !== USER_ROLES.PATIENT || user.status !== USER_STATUS.INVITED) {
      console.warn(`registerPatient: Invalid or expired invite token`);
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    if (new Date() > user.inviteTokenExpiry) {
      console.info(`registerPatient: Invite token expired for ${user.email}`);
      return res.status(400).json({ error: 'Invite token expired' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user with registration details
    const updatedUser = await updateUser({
      id: user.id,
      passwordHash,
      status: USER_STATUS.ACTIVE,
      isVerified: true,
      inviteToken: null, // Clear the invite token
      inviteTokenExpiry: null, // Clear the expiry
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date()
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

/**
 * Handles the first-time login with an invite token
 * @param {Object} user - User object from database
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} Updated user object
 */
async function handleFirstTimeLogin(user, password) {
  const hashedPassword = await hashPassword(password);
  
  return await updateUser({
    id: user.id, // Ensure we're passing the ID in the update object
    passwordHash: hashedPassword,
    status: USER_STATUS.ACTIVE,
    inviteToken: null,
    inviteTokenExpiry: null,
    isVerified: true
  });
}

/**
 * Handles regular login for verified users
 * @param {Object} user - User object from database
 * @param {string} password - Plain text password
 * @throws {Error} If credentials are invalid
 */
async function handleRegularLogin(user, password) {
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
}

export async function loginPatient(req, res) {
  try {
    // Log the incoming request details for debugging
    console.log('=== Login Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    
    // Get credentials and invite token
    const { email, password } = req.body || {};
    const inviteToken = req.query.inviteToken || req.body.inviteToken;
    
    // Input validation
    const { isValid: isInputValid, error: inputError } = validateLoginInput(email, password);
    if (!isInputValid) {
      return res.status(400).json({ error: inputError });
    }
    
    // Find and validate user
    const user = await findUserByEmail(email);
    const { isValid: isUserValid, error: userError } = validateUser(user, USER_ROLES.PATIENT);
    if (!isUserValid) {
      console.warn(`loginPatient: Invalid login attempt for email: ${email} - ${userError}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Handle first-time login with invite token
    if (inviteToken && !user.isVerified) {
      const { isValid: isTokenValid, error: tokenError } = validateInviteToken(user, inviteToken);
      if (!isTokenValid) {
        console.warn(`loginPatient: ${tokenError} for user: ${email}`);
        return res.status(401).json({ error: tokenError });
      }
      
      await handleFirstTimeLogin(user, password);
      console.log(`loginPatient: Account activated for patient ${email}`);
    } else {
      // Handle regular login
      try {
        await handleRegularLogin(user, password);
      } catch (error) {
        console.warn(`loginPatient: ${error.message} for user: ${email}`);
        return res.status(401).json({ error: error.message });
      }
    }

    // Generate and return auth token
    const token = generateAuthToken(user);
    console.log(`loginPatient: Successful login for patient ${email}`);
    
    res.json({ 
      token,
      user: prepareUserResponse(user),
      requiresPassword: false
    });
    
  } catch (error) {
    console.error(`loginPatient: Error during login: ${error.message}`, error);
    res.status(500).json({ 
      error: 'An error occurred during login. Please try again later.' 
    });
  }
}

/**
 * Get patient profile
 * @route GET /api/patient/profile
 * @access Private (Patient only)
 */
export async function getPatientProfile(req, res) {
  try {
    // The authenticated user is attached to the request by the auth middleware
    const patient = req.user;
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Return the patient's profile information
    res.json({
      id: patient.id,
      email: patient.email,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      phoneNumber: patient.phoneNumber,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      zipCode: patient.zipCode,
      country: patient.country,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      medications: patient.medications,
      conditions: patient.conditions,
      notes: patient.notes,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
}
