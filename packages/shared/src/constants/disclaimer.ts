/**
 * Disclaimer version constant — single source of truth for both FE and BE.
 *
 * Both the frontend (re-prompt gate) and the backend (acceptance validation)
 * compare against this exact value. Bump it here to invalidate all prior
 * acceptances and prompt all users to re-accept.
 *
 * Spec: REQ-DC-02, AD-DC-02
 */

/** Current disclaimer version. Bump when the legal text changes. */
export const DISCLAIMER_CURRENT_VERSION = 'v1'
