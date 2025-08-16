// Centralized environment access for OAuth server

function parseOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

const PORT = Number(process.env.OAUTH_PORT || process.env.PORT) || 3001;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000/callback';

const ENV = Object.freeze({
  PORT,
  ISSUER: process.env.OAUTH_ISSUER || `http://localhost:${PORT}`,
  CLIENT_ID: process.env.REACT_APP_CLIENT_ID || 'demo-client',
  CLIENT_REDIRECT_URI: REDIRECT_URI,
  CLIENT_LOGOUT_REDIRECT_URI: parseOrigin(REDIRECT_URI) + '/',
  CLIENT_ORIGIN: parseOrigin(REDIRECT_URI),
});

export default ENV;
export const getPort = () => ENV.PORT;
export const getIssuer = () => ENV.ISSUER;
export const getClientId = () => ENV.CLIENT_ID;
export const getClientRedirectUri = () => ENV.CLIENT_REDIRECT_URI;
export const getClientLogoutRedirectUri = () => ENV.CLIENT_LOGOUT_REDIRECT_URI;
export const getClientOrigin = () => ENV.CLIENT_ORIGIN;
