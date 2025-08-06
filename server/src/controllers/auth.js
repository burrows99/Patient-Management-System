import { findUserById } from '../models/User.js';

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User is attached to req by the auth middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get fresh user data from the database
    const user = await findUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data (excluding sensitive information)
    const { id, email, role, status, isVerified } = user;
    res.json({ id, email, role, status, isVerified });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
