import { findUserById } from '../models/User.js';

/**
 * Get current user with complete profile data
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

    // Convert Sequelize instance to plain object by accessing dataValues directly
    const userData = {
      id: user.dataValues.id,
      email: user.dataValues.email,
      role: user.dataValues.role,
      status: user.dataValues.status,
      isVerified: user.dataValues.isVerified,
      createdAt: user.dataValues.createdAt,
      updatedAt: user.dataValues.updatedAt
    };

    // Role-specific fields can be added in future updates
    // Currently, all user data is in the base userData object

    res.json(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
