// src/middleware/auth.js
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';

/**
 * W06: Real JWT/OAuth checks using Auth0 (recommended).
 *
 * Required env (Render → Environment):
 *   - AUTH0_AUDIENCE            e.g. https://your-api-identifier
 *   - AUTH0_ISSUER_BASE_URL     e.g. https://your-tenant.us.auth0.com
 *
 * Optional:
 *   - AUTH0_DOMAIN              e.g. your-tenant.us.auth0.com (used if ISSUER_BASE_URL not set)
 *   - AUTH_DISABLE=true         Bypass all auth checks (DEV ONLY)
 *   - AUTH_ROLE_CLAIM           Custom claim key for roles (default: https://example.com/roles)
 *
 * Usage on routes:
 *   router.post('/', jwtCheck, needWrite, handler)
 *   router.put('/:id', jwtCheck, needWrite, handler)
 *   router.delete('/:id', jwtCheck, needWrite, handler)
 */

const AUTH_DISABLED = String(process.env.AUTH_DISABLE || '').toLowerCase() === 'true';

const hasAuthConfig =
  !!process.env.AUTH0_AUDIENCE &&
  (!!process.env.AUTH0_ISSUER_BASE_URL || !!process.env.AUTH0_DOMAIN);

const ISSUER_BASE_URL =
  process.env.AUTH0_ISSUER_BASE_URL ||
  (process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : undefined);

function noop(_req, _res, next) {
  return next();
}

if (AUTH_DISABLED) {
  console.warn('[AUTH] AUTH_DISABLE=true → All auth checks are DISABLED (dev only).');
}
if (!hasAuthConfig && !AUTH_DISABLED) {
  console.warn(
    '[AUTH] Missing AUTH0_* env. JWT validation disabled. ' +
      'Set AUTH_DISABLE=true for local dev if intentional.'
  );
}

/** Validates RS256 JWTs when configured; else no-op for dev. */
export const jwtCheck =
  hasAuthConfig && !AUTH_DISABLED
    ? auth({
        audience: process.env.AUTH0_AUDIENCE,
        issuerBaseURL: ISSUER_BASE_URL,
        tokenSigningAlg: 'RS256'
      })
    : noop;

/** Scope guards (use these if you assign scopes in your IdP). */
const reqScopes = (scopes) =>
  hasAuthConfig && !AUTH_DISABLED ? requiredScopes(scopes) : noop;

export const needWrite = reqScopes('write:library'); // protect POST/PUT/DELETE
export const needRead = reqScopes('read:library'); // optional for GETs

/**
 * Optional: Admin role guard.
 * Expects a custom claim like: { "https://example.com/roles": ["admin"] }
 * Configure this in your IdP rule/action. Adjust the claim name to your setup.
 */
const ROLE_CLAIM = process.env.AUTH_ROLE_CLAIM || 'https://example.com/roles';

export const requireAdmin = (req, res, next) => {
  if (AUTH_DISABLED || !hasAuthConfig) return next();
  const roles = Array.isArray(req?.auth?.payload?.[ROLE_CLAIM])
    ? req.auth.payload[ROLE_CLAIM]
    : [];
  if (roles.includes('admin')) return next();
  return res.status(403).json({ message: 'Admin role required' });
};

/** Helper: get subject/user id from JWT (e.g., "auth0|123") */
export const getUserSub = (req) => req?.auth?.payload?.sub || null;
