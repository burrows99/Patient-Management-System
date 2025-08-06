import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

import { getApiUrl } from '../utils/environment';

// Get the API URL from environment configuration
const API_URL = getApiUrl();

// Log the API URL being used
console.log(`[API] Using base URL: ${API_URL}`);

// Create axios instance with default config
console.log('[API] Creating axios instance with baseURL:', API_URL);
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  timeout: 30000, // 30 seconds
});

// Log configuration
console.log('[API] Axios instance configuration:', {
  baseURL: api.defaults.baseURL,
  headers: api.defaults.headers,
  timeout: api.defaults.timeout,
  withCredentials: api.defaults.withCredentials
});

// Debug: Log axios instance creation
console.log('[API] Axios instance created:', {
  defaults: api.defaults,
  interceptors: Object.keys(api.interceptors)
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const requestId = Math.random().toString(36).substring(2, 9);
    
    // Add request ID to track request/response pairs
    config.headers['X-Request-ID'] = requestId;
    
    console.log(`[API] [${requestId}] Request: ${config.method.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      data: config.data,
      params: config.params,
      headers: {
        ...config.headers,
        // Don't log the full auth token if it exists
        ...(config.headers.Authorization ? { Authorization: 'Bearer [REDACTED]' } : {})
      },
      timeout: config.timeout,
      withCredentials: config.withCredentials
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] [${requestId}] Added auth token to request headers`);
    } else {
      console.log(`[API] [${requestId}] No auth token found in localStorage`);
    }
    
    return config;
  },
  (error) => {
    const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';
    console.error(`[API] [${requestId}] Request interceptor error:`, {
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      },
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging
api.interceptors.response.use(
  (response) => {
    const requestId = response.config?.headers?.['X-Request-ID'] || 'unknown';
    console.log(`[API] [${requestId}] Response: ${response.status} ${response.statusText}`, {
      url: response.config.url,
      method: response.config.method,
      data: response.data,
      headers: response.headers,
      config: {
        baseURL: response.config.baseURL,
        timeout: response.config.timeout,
        withCredentials: response.config.withCredentials
      }
    });
    return response;
  },
  (error) => {
    const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[API] [${requestId}] Response error: ${error.response.status} ${error.response.statusText}`, {
        url: error.config.url,
        method: error.config.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          baseURL: error.config.baseURL,
          timeout: error.config.timeout,
          withCredentials: error.config.withCredentials,
          data: error.config.data
        }
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`[API] [${requestId}] No response received:`, {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        code: error.code,
        stack: error.stack,
        config: error.config ? {
          baseURL: error.config.baseURL,
          timeout: error.config.timeout,
          withCredentials: error.config.withCredentials,
          data: error.config.data
        } : 'No config available'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`[API] [${requestId}] Request setup error:`, {
        message: error.message,
        stack: error.stack,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          baseURL: error.config.baseURL
        } : 'No config available'
      });
    }
    
    return Promise.reject(error);
  }
);

export const auth = {
  // Doctor Authentication
  registerDoctor: async (doctorData) => {
    try {
      const response = await api.post('/api/doctor/register', doctorData);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  loginDoctor: async (credentials) => {
    try {
      const response = await api.post('/api/doctor/login', credentials);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  // Patient Authentication
  registerPatient: async (patientData) => {
    try {
      const response = await api.post('/api/patient/register', patientData);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  loginPatient: async (credentials) => {
    try {
      const response = await api.post('/api/patient/login', credentials);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },
};

export default api;
