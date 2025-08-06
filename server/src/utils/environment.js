// Environment configuration for the server

// Get the current environment (default to 'development')
const env = process.env.NODE_ENV || 'development';

// Configuration for different environments
const configs = {
  development: {
    baseUrl: process.env.BASE_URL || 'http://localhost:4000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:4000', // For external access
    isDocker: process.env.DOCKER === 'true'
  },
  production: {
    baseUrl: process.env.BASE_URL || 'http://localhost:4000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:4000', // For external access
    isDocker: true
  }
};

// Get the current config based on environment
const config = configs[env] || configs.development;

// Helper functions
export const getBaseUrl = () => config.baseUrl;
export const getFrontendUrl = () => config.frontendUrl;
export const isDocker = () => config.isDocker;

// For verification links and other absolute URLs that need to be accessible from outside Docker
export const getFullUrl = (path = '') => {
  // Use PUBLIC_URL for verification links since they're accessed from outside Docker
  const base = (config.publicUrl || config.baseUrl).endsWith('/') 
    ? (config.publicUrl || config.baseUrl).slice(0, -1) 
    : (config.publicUrl || config.baseUrl);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

// For internal API calls within Docker network
export const getInternalUrl = (path = '') => {
  const base = config.baseUrl.endsWith('/') 
    ? config.baseUrl.slice(0, -1) 
    : config.baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export default {
  getBaseUrl,
  getFrontendUrl,
  isDocker,
  getFullUrl
};
