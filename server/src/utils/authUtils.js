import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middlewares/auth.js';
import { USER_ROLES } from '../constants/user.js';

/**
 * Validates login input parameters
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {{isValid: boolean, error: string|null}}
 */
export const validateLoginInput = (email, password) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates user credentials and role
 * @param {Object} user - User object from database
 * @param {string} role - Expected user role
 * @returns {{isValid: boolean, error: string|null}}
 */
export const validateUser = (user, role = USER_ROLES.PATIENT) => {
  if (!user) {
    return { isValid: false, error: 'User not found' };
  }
  if (user.role !== role) {
    return { isValid: false, error: 'Invalid user role' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates an invite token
 * @param {Object} user - User object from database
 * @param {string} inviteToken - Invite token from request
 * @returns {{isValid: boolean, error: string|null}}
 */
export const validateInviteToken = (user, inviteToken) => {
  if (!inviteToken) {
    return { isValid: false, error: 'Invite token is required' };
  }
  if (user.inviteToken !== inviteToken) {
    return { isValid: false, error: 'Invalid invitation link' };
  }
  if (new Date() > new Date(user.inviteTokenExpiry)) {
    return { isValid: false, error: 'Invitation link has expired' };
  }
  return { isValid: true, error: null };
};

/**
 * Hashes a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Verifies a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Whether the password matches the hash
 */
export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generates a JWT token for a user
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
export const generateAuthToken = (user, expiresIn = '1h') => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role || USER_ROLES.PATIENT,
      email: user.email
    }, 
    JWT_SECRET, 
    { 
      expiresIn,
      issuer: 'nhs-patient-portal',
      subject: user.id.toString()
    }
  );
};

/**
 * Prepares user data for response
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user data
 */
export const prepareUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified
});
