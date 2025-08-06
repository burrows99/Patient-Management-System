/**
 * Handles API errors consistently across the application
 * @param {Error} error - The error object from the API call
 * @returns {string} A user-friendly error message
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    
    if (status === 401) {
      return 'Unauthorized. Please log in again.';
    }
    
    if (status === 400 && data && data.message) {
      return data.message;
    }
    
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    
    return data?.message || `Error: ${status}`;
  }
  
  if (error.request) {
    // The request was made but no response was received
    return 'No response from server. Please check your internet connection.';
  }
  
  // Something happened in setting up the request that triggered an Error
  return error.message || 'An unexpected error occurred.';
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long',
    };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number',
    };
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one letter',
    };
  }
  
  return {
    valid: true,
    message: 'Password is valid',
  };
};
