/**
 * Error handling utilities
 * Following SRP: Single responsibility of handling and formatting errors
 */

/**
 * Error severity levels for consistent error classification
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
};

/**
 * Handles API errors consistently across the application
 * @param {Error} error - The error object from the API call
 * @returns {Object} Structured error information
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  const errorInfo = {
    message: 'An unexpected error occurred.',
    type: ERROR_TYPES.UNKNOWN,
    severity: ERROR_SEVERITY.MEDIUM,
    statusCode: null,
    originalError: error
  };
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    errorInfo.statusCode = status;
    
    switch (status) {
      case 400:
        errorInfo.message = data?.message || 'Bad request. Please check your input.';
        errorInfo.type = ERROR_TYPES.VALIDATION;
        errorInfo.severity = ERROR_SEVERITY.LOW;
        break;
        
      case 401:
        errorInfo.message = 'Unauthorized. Please log in again.';
        errorInfo.type = ERROR_TYPES.AUTHENTICATION;
        errorInfo.severity = ERROR_SEVERITY.HIGH;
        break;
        
      case 403:
        errorInfo.message = 'Access denied. You do not have permission to perform this action.';
        errorInfo.type = ERROR_TYPES.AUTHORIZATION;
        errorInfo.severity = ERROR_SEVERITY.HIGH;
        break;
        
      case 404:
        errorInfo.message = 'The requested resource was not found.';
        errorInfo.type = ERROR_TYPES.CLIENT;
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        break;
        
      case 409:
        errorInfo.message = data?.message || 'Conflict. The resource already exists or is in use.';
        errorInfo.type = ERROR_TYPES.VALIDATION;
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        break;
        
      case 422:
        errorInfo.message = data?.message || 'Validation failed. Please check your input.';
        errorInfo.type = ERROR_TYPES.VALIDATION;
        errorInfo.severity = ERROR_SEVERITY.LOW;
        break;
        
      case 429:
        errorInfo.message = 'Too many requests. Please try again later.';
        errorInfo.type = ERROR_TYPES.CLIENT;
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        break;
        
      case 500:
        errorInfo.message = 'Internal server error. Please try again later.';
        errorInfo.type = ERROR_TYPES.SERVER;
        errorInfo.severity = ERROR_SEVERITY.CRITICAL;
        break;
        
      case 502:
      case 503:
      case 504:
        errorInfo.message = 'Service temporarily unavailable. Please try again later.';
        errorInfo.type = ERROR_TYPES.SERVER;
        errorInfo.severity = ERROR_SEVERITY.HIGH;
        break;
        
      default:
        errorInfo.message = data?.message || `Error: ${status}`;
        errorInfo.type = status >= 500 ? ERROR_TYPES.SERVER : ERROR_TYPES.CLIENT;
        errorInfo.severity = status >= 500 ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.MEDIUM;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorInfo.message = 'No response from server. Please check your internet connection.';
    errorInfo.type = ERROR_TYPES.NETWORK;
    errorInfo.severity = ERROR_SEVERITY.HIGH;
  } else {
    // Something happened in setting up the request that triggered an Error
    errorInfo.message = error.message || 'An unexpected error occurred.';
    errorInfo.type = ERROR_TYPES.CLIENT;
    errorInfo.severity = ERROR_SEVERITY.MEDIUM;
  }
  
  return errorInfo;
};

/**
 * Gets a user-friendly error message from error info
 * @param {Object} errorInfo - Error information object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (errorInfo) => {
  if (typeof errorInfo === 'string') {
    return errorInfo;
  }
  
  return errorInfo?.message || 'An unexpected error occurred.';
};

/**
 * Determines if an error should trigger a logout (authentication errors)
 * @param {Object} errorInfo - Error information object
 * @returns {boolean} True if should logout, false otherwise
 */
export const shouldLogout = (errorInfo) => {
  return errorInfo?.type === ERROR_TYPES.AUTHENTICATION || errorInfo?.statusCode === 401;
};

/**
 * Determines if an error should be retried automatically
 * @param {Object} errorInfo - Error information object
 * @returns {boolean} True if should retry, false otherwise
 */
export const shouldRetry = (errorInfo) => {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(errorInfo?.statusCode) || errorInfo?.type === ERROR_TYPES.NETWORK;
};

/**
 * Logs error information with appropriate level
 * @param {Object} errorInfo - Error information object
 * @param {string} context - Additional context for the error
 */
export const logError = (errorInfo, context = '') => {
  const logMessage = `${context ? `[${context}] ` : ''}${errorInfo.message}`;
  
  switch (errorInfo.severity) {
    case ERROR_SEVERITY.CRITICAL:
      console.error('🚨 CRITICAL ERROR:', logMessage, errorInfo);
      break;
    case ERROR_SEVERITY.HIGH:
      console.error('❌ HIGH ERROR:', logMessage, errorInfo);
      break;
    case ERROR_SEVERITY.MEDIUM:
      console.warn('⚠️ MEDIUM ERROR:', logMessage, errorInfo);
      break;
    case ERROR_SEVERITY.LOW:
      console.info('ℹ️ LOW ERROR:', logMessage, errorInfo);
      break;
    default:
      console.log('📝 ERROR:', logMessage, errorInfo);
  }
};

/**
 * Creates a standardized error response for consistent error handling
 * @param {string} message - Error message
 * @param {string} type - Error type
 * @param {string} severity - Error severity
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error object
 */
export const createError = (message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = {}) => {
  return {
    message,
    type,
    severity,
    timestamp: new Date().toISOString(),
    ...details
  };
};
