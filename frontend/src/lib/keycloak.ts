import Keycloak from 'keycloak-js';

/**
 * Keycloak client instance
 * Configured with Authorization Code Flow + PKCE for SPA security
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'master',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'nearbynurse-frontend',
});

/**
 * Initialize Keycloak with secure settings
 * - Uses Authorization Code Flow + PKCE (pkceMethod: 'S256')
 * - checkLoginIframe: false (avoid silent check-sso issues in dev)
 * - onLoad: 'check-sso' (check if user already logged in without forcing login)
 */
export const initKeycloak = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      pkceMethod: 'S256', // Enable PKCE for Authorization Code Flow
      // Token stored in memory by default, can use sessionStorage if needed
      // responseMode: 'fragment', // or 'query' depending on your needs
    });

    console.log(`Keycloak initialized. Authenticated: ${authenticated}`);
    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    return false;
  }
};

/**
 * Token Storage Strategy:
 * - Default: In-memory (most secure, tokens lost on refresh)
 * - Alternative: sessionStorage (persists during session, cleared on tab close)
 * - Never use localStorage for refresh tokens (XSS vulnerability)
 *
 * Best Practice for Production:
 * Use backend-for-frontend (BFF) pattern:
 * 1. Frontend redirects to Keycloak
 * 2. Keycloak redirects to backend with code
 * 3. Backend exchanges code for tokens
 * 4. Backend stores refresh token securely
 * 5. Backend sets HttpOnly cookie with session ID
 * 6. Frontend only handles access token (short-lived)
 */

export default keycloak;

