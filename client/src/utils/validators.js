/**
 * Input validation utilities
 * Following SRP: Single responsibility of validating user inputs
 */

/**
 * Validates email format using RFC-compliant regex
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase().trim());
};

/**
 * Validates password strength with comprehensive rules
 * @param {string} password - The password to validate
 * @returns {{valid: boolean, message: string, errors: string[]}} Validation result with detailed feedback
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Password is required',
      errors: ['Password is required']
    };
  }
  
  // Length validation
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Number validation
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Letter validation
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  // Special character validation (optional but recommended)
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password should contain at least one special character');
  }
  
  const isValid = errors.length === 0;
  
  return {
    valid: isValid,
    message: isValid ? 'Password is valid' : errors[0], // Return first error as main message
    errors
  };
};

/**
 * Validates required field is not empty
 * @param {any} value - The value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validateRequired = (value, fieldName = 'Field') => {
  const isValid = value !== null && value !== undefined && String(value).trim() !== '';
  
  return {
    valid: isValid,
    message: isValid ? `${fieldName} is valid` : `${fieldName} is required`
  };
};

/**
 * Validates string length within specified range
 * @param {string} value - The string to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field for error messages
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validateLength = (value, minLength = 0, maxLength = Infinity, fieldName = 'Field') => {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      message: `${fieldName} must be a valid string`
    };
  }
  
  const length = value.trim().length;
  
  if (length < minLength) {
    return {
      valid: false,
      message: `${fieldName} must be at least ${minLength} characters long`
    };
  }
  
  if (length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} must not exceed ${maxLength} characters`
    };
  }
  
  return {
    valid: true,
    message: `${fieldName} length is valid`
  };
};

/**
 * Validates phone number format (basic validation)
 * @param {string} phone - The phone number to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return {
      valid: false,
      message: 'Phone number is required'
    };
  }
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it has at least 10 digits (basic validation)
  if (digitsOnly.length < 10) {
    return {
      valid: false,
      message: 'Phone number must have at least 10 digits'
    };
  }
  
  return {
    valid: true,
    message: 'Phone number is valid'
  };
};

/**
 * Validates form data against multiple validation rules
 * @param {Object} data - The form data to validate
 * @param {Object} rules - Validation rules for each field
 * @returns {{valid: boolean, errors: Object}} Validation result with field-specific errors
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(fieldName => {
    const fieldRules = rules[fieldName];
    const fieldValue = data[fieldName];
    
    fieldRules.forEach(rule => {
      if (typeof rule === 'function') {
        const result = rule(fieldValue, fieldName);
        if (!result.valid) {
          errors[fieldName] = errors[fieldName] || [];
          errors[fieldName].push(result.message);
          isValid = false;
        }
      }
    });
  });
  
  return {
    valid: isValid,
    errors
  };
};
