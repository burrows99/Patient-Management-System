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
  // Base URL for Synthea HTTP interface (Docker service defaults to http://synthea)
  SYNTHEA_BASE: process.env.SYNTHEA_BASE || 'http://synthea',
  // Base URL for HAPI FHIR server (inside Docker network by default)
  HAPI_BASE_URL: process.env.HAPI_BASE_URL || 'http://hapi-server:8080/fhir',
  // Directory where Synthea writes JSON outputs (mounted into api-server container)
  SYNTHEA_OUTPUT_DIR: process.env.SYNTHEA_OUTPUT_DIR || '/synthea/output',
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
export const getSyntheaBase = () => ENV.SYNTHEA_BASE;
export const getHapiBase = () => ENV.HAPI_BASE_URL;
export const getSyntheaOutputDir = () => ENV.SYNTHEA_OUTPUT_DIR;
