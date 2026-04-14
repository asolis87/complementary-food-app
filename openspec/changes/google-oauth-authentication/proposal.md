# Google OAuth Authentication — Proposal

**Change**: google-oauth-authentication
**Status**: proposal
**Date**: 2026-04-14

---

## 1. Intent

Enable users to sign in and sign up with their Google account via OAuth 2.0 redirect flow. The auth foundation (BetterAuth + Prisma Account model) is already in place — this change wires the remaining 50% to make Google OAuth fully functional, including the CRITICAL gap of auto-provisioning trials for OAuth signups.

### Why now

- Google sign-in reduces friction for new users (no password to remember, one-click onboarding)
- The backend provider config and DB schema are already stubbed — this is low-effort, high-impact
- Trial bypass for OAuth users is a billing integrity risk that must be closed before launch

---

## 2. Scope

| Package | Impact |
|---------|--------|
| `apps/api` | Backend auth config hardening + BetterAuth lifecycle hook for trial provisioning |
| `apps/web` | Frontend Google button wiring + post-OAuth redirect handling |
| `docker-compose.override.yml` | Dev environment Google OAuth env vars |
| Root config | `.env.example` documentation |

**Database**: No schema changes needed. The Prisma `Account` model already has `providerId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `scope` fields.

---

## 3. Approach

### 3.1 OAuth Flow (redirect-based, no popup)

```
User clicks "Continuar con Google"
  → window.location.href = '{API_BASE}/api/auth/sign-in/google'
  → BetterAuth redirects to Google consent screen
  → Google redirects back to BetterAuth callback
  → BetterAuth creates/links Account, sets session cookie
  → BetterAuth lifecycle hook provisions trial (if new user)
  → Redirect to FRONTEND_URL with session active
  → Frontend checkSession() picks up the user
```

**Key decision**: Redirect-based flow, NOT popup. Simpler, more reliable across mobile browsers, and BetterAuth's native pattern. The frontend does NOT need a BetterAuth client SDK — a simple `window.location.href` redirect is sufficient.

### 3.2 Trial Auto-Provisioning (server-side lifecycle hook)

**Key decision**: Trial provisioning for OAuth users MUST happen server-side via BetterAuth's `onUserCreated` (or equivalent `after` hook on the social sign-in handler), NOT on the frontend.

**Why**: The current email signup flow calls `billingStore.startTrial()` on the frontend after `signUp()`. OAuth users never hit `signUp()` — BetterAuth creates their account internally during the callback. If we try to detect "new OAuth user" on the frontend, we introduce a race condition and a fragile heuristic. The server is the single source of truth for "this is a new user."

The hook will:
1. Detect if the user was just created (vs. returning OAuth user)
2. Call the billing/subscription service to provision a 21-day trial
3. Set `subscriptionStatus = 'TRIALING'` and `trialEnd` on the user record

### 3.3 Auth Config Hardening

**Key decision**: The existing conditional spread `...(process.env['GOOGLE_CLIENT_ID'] && { socialProviders: ... })` must require BOTH `GOOGLE_CLIENT_ID` AND `GOOGLE_CLIENT_SECRET`. Currently, if only the client ID is set, the provider activates with an empty string secret — which will fail silently at runtime.

New guard:
```ts
const googleEnabled = process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']
```

### 3.4 Frontend Wiring

- `LoginPage.vue`: `handleGoogleLogin()` → `window.location.href` to Google OAuth endpoint
- `SignupPage.vue`: `handleGoogleSignup()` → same redirect (BetterAuth handles create-or-link)
- `SignupPage.vue`: Fix Google button — currently uses `icon="language"` (globe icon) instead of the Google SVG used in LoginPage
- Post-OAuth landing: Frontend needs a route/guard that runs `checkSession()` on mount and redirects appropriately (existing App.vue mount or router guard likely handles this already)

### 3.5 Post-OAuth Redirect

After BetterAuth completes the OAuth callback, it redirects to `callbackURL` (defaults to `FRONTEND_URL` or `/`). The frontend's existing `checkSession()` on app mount will pick up the session. For new users, the server-side hook already provisioned the trial, so the session-info response will include the correct subscription status.

**Open question**: Should new OAuth users land on `/onboarding/plan` (like email signups) or go straight to `/`? Recommendation: go to `/` — the trial is already active, and the onboarding plan page is about choosing a plan, which is less relevant when the trial auto-starts.

---

## 4. Affected Modules

### Backend (`apps/api`)

| File | Change |
|------|--------|
| `src/modules/auth/auth.config.ts` | Harden Google provider guard (require both ID + secret), add `onUserCreated` lifecycle hook for trial provisioning, configure `callbackURL` |
| `src/modules/billing/` (if exists) or inline in auth config | Trial provisioning logic callable from the lifecycle hook |

### Frontend (`apps/web`)

| File | Change |
|------|--------|
| `src/modules/auth/LoginPage.vue` | Wire `handleGoogleLogin()` to redirect to OAuth endpoint |
| `src/modules/auth/SignupPage.vue` | Wire `handleGoogleSignup()` to redirect to OAuth endpoint, fix Google button icon (replace `icon="language"` with SVG) |
| `src/shared/stores/authStore.ts` | Add `signInWithGoogle()` action (constructs redirect URL) |

### DevOps / Config

| File | Change |
|------|--------|
| `docker-compose.override.yml` | Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars (commented out with instructions) |
| `.env.example` (new) | Document all auth-related env vars including Google OAuth |

---

## 5. Rollback Plan

Google OAuth is additive and behind an env-var feature flag. Rollback:

1. **Instant disable**: Remove `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from environment. The conditional spread in `auth.config.ts` disables the provider entirely — no code change needed.
2. **Code rollback**: Revert the PR. The Google buttons become no-ops again (current state).
3. **Data**: OAuth accounts created via Google remain in the `Account` table but are inert without the provider enabled. Users can still sign in with email/password if they set one up.

No database migrations to reverse. No breaking changes to existing email/password flow.

---

## 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Trial bypass for OAuth users** | CRITICAL | Server-side lifecycle hook auto-provisions trial. This is the primary reason for this change. |
| **Silent failure with partial env vars** | HIGH | Harden guard to require both `GOOGLE_CLIENT_ID` AND `GOOGLE_CLIENT_SECRET`. Log a warning if only one is set. |
| **User.name NOT NULL constraint** | MEDIUM | BetterAuth populates `name` from Google profile (`given_name + family_name`). Verify BetterAuth's default mapping handles this. Add fallback in hook if needed. |
| **OAuth redirect URL mismatch** | MEDIUM | Document required Google Cloud Console callback URL (`{BETTER_AUTH_URL}/api/auth/callback/google`). Add to `.env.example`. |
| **CORS/cookie issues in dev** | LOW | `BETTER_AUTH_URL`, `FRONTEND_URL`, and `trustedOrigins` must align. Already configured in docker-compose.override.yml. |
| **Post-OAuth redirect loses intended destination** | LOW | BetterAuth supports `callbackURL` parameter. Can pass original `?redirect=` through the flow if needed (enhancement, not MVP). |

---

## 7. Out of Scope

- **Other OAuth providers** (Apple, Facebook, GitHub) — Google only for MVP
- **Account linking UI** — If a user signs up with email then tries Google with the same email, BetterAuth handles this automatically (links accounts). No custom UI needed.
- **Google One Tap** — Popup/iframe-based sign-in. Not needed for MVP; redirect flow is sufficient.
- **Token refresh logic** — BetterAuth manages OAuth token lifecycle internally
- **Custom consent screen branding** — Google Cloud Console configuration, not app code
- **Email verification for OAuth users** — Google already verified the email; BetterAuth marks it as verified
- **Password setup for OAuth-only users** — Future enhancement if needed
