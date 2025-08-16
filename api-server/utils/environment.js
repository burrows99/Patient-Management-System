// Centralized server environment access for API server

function parseOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url || 'http://localhost:3000';
  }
}

const ENV = Object.freeze({
  // Prefer API_PORT if set; fallback to PORT for backward compatibility
  PORT: Number(process.env.API_PORT || process.env.PORT) || 4001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  NHS_API_KEY: process.env.NHS_API_KEY || '',
  // Client origin derived from redirect URI if provided
  CLIENT_ORIGIN: parseOrigin(process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000/callback'),
  // Public bases (for docs, links)
  PUBLIC_API_BASE: process.env.REACT_APP_API_BASE || 'http://localhost:4001',
});

export default ENV;
export const getPort = () => ENV.PORT;
export const getClientOrigin = () => ENV.CLIENT_ORIGIN;
export const getNhsApiKey = () => ENV.NHS_API_KEY;
export const getPublicApiBase = () => ENV.PUBLIC_API_BASE;
