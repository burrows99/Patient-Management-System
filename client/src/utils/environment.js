// Centralized client environment access
// Only REACT_APP_* variables are exposed to the browser

const required = (name, value) => {
  if (!value) {
    // Non-fatal warning to help during dev
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing ${name}. Check root .env and docker compose.`);
  }
  return value;
};

const config = Object.freeze({
  API_BASE: required('REACT_APP_API_BASE', process.env.REACT_APP_API_BASE || 'http://localhost:4001'),
  OAUTH_BASE: required('REACT_APP_OAUTH_BASE', process.env.REACT_APP_OAUTH_BASE || 'http://localhost:3001'),
  CLIENT_ID: required('REACT_APP_CLIENT_ID', process.env.REACT_APP_CLIENT_ID || ''),
  REDIRECT_URI: required('REACT_APP_REDIRECT_URI', process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000/callback'),
  SCOPE: process.env.REACT_APP_SCOPE || 'openid',
});

export default config;
export const getApiBase = () => config.API_BASE;
export const getOAuthBase = () => config.OAUTH_BASE;
export const getClientId = () => config.CLIENT_ID;
export const getRedirectUri = () => config.REDIRECT_URI;
export const getScope = () => config.SCOPE;
