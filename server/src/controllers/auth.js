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

    // Base user data
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      emergencyContact: user.emergencyContact,
      emergencyPhone: user.emergencyPhone,
      bloodType: user.bloodType,
      allergies: user.allergies,
      medications: user.medications,
      conditions: user.conditions,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Add role-specific fields
    if (user.role === 'patient') {
      // Add any patient-specific fields here
      userData.patientDetails = user.patientDetails || {};
    } else if (user.role === 'doctor') {
      // Add any doctor-specific fields here
      userData.doctorDetails = user.doctorDetails || {};
      userData.specialization = user.specialization;
      userData.licenseNumber = user.licenseNumber;
    }

    res.json(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
