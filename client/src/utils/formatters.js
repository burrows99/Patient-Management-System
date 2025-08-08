/**
 * Utility functions for data formatting
 * Follows SRP: Each function has a single responsibility
 */

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date or 'Not specified'
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats user status for display
 * @param {string} status - Raw status from API
 * @returns {string} Formatted status
 */
export const formatStatus = (status) => {
  if (!status) return 'Not specified';
  return status.replace('_', ' ').toUpperCase();
};

/**
 * Formats user role for display
 * @param {string} role - Raw role from API
 * @returns {string} Formatted role
 */
export const formatRole = (role) => {
  if (!role) return 'Not specified';
  return role.toUpperCase();
};

/**
 * Formats boolean verification status
 * @param {boolean} isVerified - Verification status
 * @returns {string} 'Yes' or 'No'
 */
export const formatVerificationStatus = (isVerified) => {
  return isVerified ? 'Yes' : 'No';
};
