// Environment configuration for the client

// Get the current environment (default to 'development')
const env = process.env.NODE_ENV || 'development';

// Configuration for different environments
const configs = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:4000',
    isDocker: process.env.REACT_APP_DOCKER === 'true'
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:4000',
    isDocker: true
  }
};

// Get the current config based on environment
const config = configs[env] || configs.development;

// Helper functions
export const getApiUrl = () => config.apiUrl;
export const isDocker = () => config.isDocker;

// For making full API URLs
export const getApiEndpoint = (path = '') => {
  const base = config.apiUrl.endsWith('/') 
    ? config.apiUrl.slice(0, -1) 
    : config.apiUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

const environment = {
  getApiUrl,
  isDocker,
  getApiEndpoint
};

export default environment;
