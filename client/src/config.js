const config = {
  // Use the environment variable if it exists, otherwise default to local development
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:4000',
};

export default config;
