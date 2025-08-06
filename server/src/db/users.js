// /db/users.js
import User from '../models/User.js';
import { USER_ROLES } from '../constants/user.js';

export async function findUserByEmail(email) {
  return await User.findOne({ where: { email } });
}

export async function findUserByVerificationToken(token) {
  return await User.findOne({ where: { verificationToken: token } });
}

export async function findUserByInviteToken(token) {
  return await User.findOne({ where: { inviteToken: token } });
}

export async function findUserById(id) {
  return await User.findByPk(id);
}

export async function addUser(userData) {
  return await User.create(userData);
}

export async function updateUser(userData) {
  try {
    const { id, ...updateData } = userData;
    if (!id) {
      console.error('updateUser: User ID is required for update');
      throw new Error('User ID is required for update');
    }
    
    console.log(`updateUser: Updating user ${id} with data:`, updateData);
    
    const [updatedCount] = await User.update(updateData, {
      where: { id },
      returning: true,
      individualHooks: true
    });

    if (updatedCount === 0) {
      console.error(`updateUser: No user found with id ${id}`);
      return null;
    }
    
    // Fetch the updated user to return all fields
    const updatedUser = await User.findByPk(id);
    console.log('updateUser: Successfully updated user:', updatedUser?.get({ plain: true }));
    return updatedUser;
    
  } catch (error) {
    console.error('updateUser: Error updating user:', error);
    throw error;
  }
}

export async function getAllUsers() {
  return await User.findAll();
}

/**
 * Find all patients associated with a specific doctor
 * @param {number} doctorId - The ID of the doctor
 * @returns {Promise<Array>} Array of patient users
 */
export async function findUsersByDoctorId(doctorId) {
  return await User.findAll({
    where: { 
      invitedBy: doctorId,  // Using invitedBy instead of doctorId
      role: USER_ROLES.PATIENT // Only return patients
    },
    order: [['createdAt', 'DESC']]
  });
}
