# Google OAuth Authentication — Technical Design

**Change**: google-oauth-authentication
**Status**: design
**Date**: 2026-04-14
**Refs**: Proposal (sdd/google-oauth-authentication/proposal)

---

## 1. Architecture Decisions

### AD-GOAUTH-01: Redirect-based flow (no popup, no client SDK)

**Decision**: Use `window.location.href` redirect to the BetterAuth-managed Google OAuth endpoint. No BetterAuth client SDK (`@better-auth/client`) needed on the frontend.

**Rationale**:
- Simpler implementation: no additional client dependency
- More reliable across browsers (popups are blocked by many browsers/extensions)
- BetterAuth already handles the full OAuth dance server-side via `toNodeHandler`
- Session cookie is set automatically on the callback redirect
- The existing wildcard route `fastify.all('/*')` in `auth.routes.ts` already forwards all `/api/auth/*` requests to BetterAuth, including `/api/auth/sign-in/social` and `/api/auth/callback/google`

**Flow**: `window.location.href = '{API_BASE}/api/auth/sign-in/social?provider=google&callbackURL=/&newUserCallbackURL=/onboarding/plan'`

**Rejected alternatives**:
- BetterAuth client SDK `signIn.social()` — adds ~15KB dependency for a single redirect
- Popup flow — blocked by Safari, requires cross-window messaging
- Google Identity Services SDK — redundant when BetterAuth handles OAuth natively

### AD-GOAUTH-02: Server-side trial provisioning via BetterAuth `databaseHooks`

**Decision**: Use BetterAuth's `databaseHooks.user.create.after` hook to auto-provision a 21-day trial subscription for every new user, regardless of signup method (email or OAuth).

**Rationale**:
- CRITICAL FIX: Current email signup calls `billingStore.startTrial()` on the frontend after `signUp()`. OAuth bypasses this entirely because the user never hits the signup form — they return via a redirect callback.
- Server-side hook is the single source of truth for "new user" detection
- Eliminates the need for the frontend to call `billingStore.startTrial()` after email signup too (simplification)
- The hook fires for BOTH email signup AND OAuth first-login (which creates a new user)
- Uses the existing `createTrialSubscription()` from `billing.service.ts` — no new billing logic needed

**Hook signature** (from BetterAuth docs):
```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        // user has: id, email, name, etc.
        await createTrialSubscription(prisma, {
          userId: user.id,
          plan: 'TRIAL',
        })
      }
    }
  }
}
```

**Important**: The `after` hook receives the created user object. It does NOT need `ctx`. The trial creation is fire-and-forget (log errors but don't block user creation).

### AD-GOAUTH-03: Conditional Google provider activation (env-var gated)

**Decision**: Activate Google social provider ONLY when BOTH `GOOGLE_CLIENT_ID` AND `GOOGLE_CLIENT_SECRET` are non-empty strings. Frontend hides Google buttons when the API doesn't have Google configured.

**Rationale**:
- Current code activates with `process.env['GOOGLE_CLIENT_ID'] && { ... }` but defaults `clientSecret` to `''` — this means if only `GOOGLE_CLIENT_ID` is set, BetterAuth gets an empty secret and fails silently or returns opaque errors
- Requiring both vars prevents partial configuration
- Frontend detects availability via a new `/api/auth/providers` endpoint or simply attempts the redirect and handles errors (simpler: just always show the button, let BetterAuth return an error if not configured — but hiding is better UX)

**Implementation**: The config guard becomes:
```typescript
const googleEnabled =
  !!process.env['GOOGLE_CLIENT_ID'] &&
  !!process.env['GOOGLE_CLIENT_SECRET']

// In betterAuth config:
...(googleEnabled && {
  socialProviders: {
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
    },
  },
})
```

**Frontend strategy**: For MVP, always show the Google button. If Google isn't configured on the server, BetterAuth returns a 404/error on the sign-in endpoint, and the user sees a generic "Google login unavailable" error. A future enhancement could expose `/api/auth/providers` to conditionally render.

### AD-GOAUTH-04: Account linking strategy

**Decision**: Rely on BetterAuth's automatic account linking by email. When a Google sign-in email matches an existing email+password user, BetterAuth adds a new `Account` row (providerId: "google") linked to the same `User`. No custom linking logic needed.

**Rationale**:
- BetterAuth's default behavior: if a user with the same email exists, it links the social account to that user rather than creating a duplicate
- The Prisma `Account` model already supports multiple accounts per user (no unique constraint on userId)
- The user can then sign in with either method (email+password OR Google)
- No UI prompt needed ("This email already has an account") — linking is silent and automatic
- If we wanted to PREVENT auto-linking (security concern), we'd set `disableImplicitSignUp: true` on the Google provider — but for this app, auto-linking is the desired UX

**Edge case**: If a user signs up via Google first (no password), they cannot sign in via email+password unless they explicitly set a password. This is acceptable for MVP — out of scope per proposal.

---

## 2. Component Design

### 2.1 `apps/api/src/modules/auth/auth.config.ts`

**Current state**: BetterAuth config with email+password, conditional Google spread, no lifecycle hooks.

**Changes**:

1. **Harden env guard** — Replace the single `GOOGLE_CLIENT_ID` check with a dual check:
   ```typescript
   const googleEnabled =
     !!process.env['GOOGLE_CLIENT_ID'] &&
     !!process.env['GOOGLE_CLIENT_SECRET']
   ```

2. **Add `databaseHooks.user.create.after`** — Auto-provision trial:
   ```typescript
   import { createTrialSubscription } from '../billing/billing.service.js'

   databaseHooks: {
     user: {
       create: {
         after: async (user) => {
           try {
             await createTrialSubscription(prisma, {
               userId: user.id,
               plan: 'TRIAL',
             })
           } catch (err) {
             // Log but don't block — user creation must succeed even if trial fails
             console.error('[auth] Failed to provision trial for user', user.id, err)
           }
         },
       },
     },
   }
   ```

3. **Clean up socialProviders spread** — Use the `googleEnabled` variable:
   ```typescript
   ...(googleEnabled && {
     socialProviders: {
       google: {
         clientId: process.env['GOOGLE_CLIENT_ID']!,
         clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
       },
     },
   })
   ```

**Impact**: This file gains ~20 lines. No new dependencies (billing.service.ts is same package).

### 2.2 `apps/web/src/shared/stores/authStore.ts`

**Current state**: Has `signIn`, `signUp`, `signOut`, `checkSession`. No Google method.

**Changes**:

1. **Add `signInWithGoogle()` action**:
   ```typescript
   function signInWithGoogle(): void {
     const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
     const callbackURL = '/'
     const newUserCallbackURL = '/onboarding/plan'
     window.location.href =
       `${apiBase}/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(callbackURL)}&newUserCallbackURL=${encodeURIComponent(newUserCallbackURL)}`
   }
   ```

   This is a synchronous redirect — no async, no loading state, no error handling needed at the call site. The browser navigates away entirely.

2. **Export `signInWithGoogle`** from the store return.

3. **Note**: The `signUp` method's frontend trial provisioning (`billingStore.startTrial()`) will be REMOVED in a follow-up task once the server-side hook is confirmed working. For now, keeping it as a safety net (double-provision is idempotent thanks to the conflict check in `createTrialSubscription`).

### 2.3 `apps/web/src/modules/auth/LoginPage.vue`

**Current state**: `handleGoogleLogin()` is a no-op with a comment.

**Changes**:

1. **Wire `handleGoogleLogin`**:
   ```typescript
   function handleGoogleLogin() {
     authStore.signInWithGoogle()
   }
   ```

   That is it. The redirect flow handles the rest. No loading state changes needed since the page navigates away.

### 2.4 `apps/web/src/modules/auth/SignupPage.vue`

**Current state**: `handleGoogleSignup()` is a no-op. Uses `icon="language"` (globe icon) instead of Google SVG.

**Changes**:

1. **Wire `handleGoogleSignup`**:
   ```typescript
   function handleGoogleSignup() {
     authStore.signInWithGoogle()
   }
   ```

   Note: `signInWithGoogle()` is the same for both login and signup. BetterAuth handles "is this a new user?" internally. The `newUserCallbackURL` param redirects new users to `/onboarding/plan`.

2. **Replace `AppButton` with Google SVG icon button** — Match LoginPage's visual style:
   Replace the `<AppButton variant="outline" icon="language">` with the same `<button class="google-icon-btn">` + inline SVG used in LoginPage, or a full-width outlined button with the SVG icon. Decision: keep the full-width button (better UX on signup page where the user might not recognize the small icon) but replace `icon="language"` with the Google SVG inline.

### 2.5 `docker-compose.override.yml`

**Current state**: Has API env vars for auth but no Google OAuth vars.

**Changes**: Add commented Google OAuth env vars to the `api` service:

```yaml
# ── Google OAuth (optional — uncomment to enable) ──
# GOOGLE_CLIENT_ID: ""
# GOOGLE_CLIENT_SECRET: ""
```

### 2.6 `.env.example` (new file)

**Purpose**: Document all required and optional env vars for the project.

**Content**:
```bash
# ── Database ──
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pakulab_dev

# ── BetterAuth ──
BETTER_AUTH_SECRET=change-me-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# ── Frontend ──
FRONTEND_URL=http://localhost:5174
CORS_ORIGIN=http://localhost:5173

# ── Google OAuth (optional — omit to disable Google sign-in) ──
# Get credentials: https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: {BETTER_AUTH_URL}/api/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Stripe (optional) ──
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
```

---

## 3. Sequence Diagrams

### 3.1 Google Sign-In (existing user)

```
User        Frontend (Vue)       API (Fastify/BetterAuth)     Google
 |               |                        |                      |
 |--click btn--->|                        |                      |
 |               |--location.href-------->|                      |
 |               |  /api/auth/sign-in/    |                      |
 |               |  social?provider=      |                      |
 |               |  google&callbackURL=/  |                      |
 |               |                        |--302 redirect------->|
 |               |                        |  accounts.google.com |
 |               |                        |  /o/oauth2/v2/auth   |
 |<--------------|---------redirect to Google consent----------->|
 |                                                               |
 |--user grants consent----------------------------------------->|
 |               |                        |<--code callback------|
 |               |                        |  /api/auth/callback/ |
 |               |                        |  google?code=xyz     |
 |               |                        |                      |
 |               |                        |--exchange code------>|
 |               |                        |<--tokens + profile---|
 |               |                        |                      |
 |               |                        |--find user by email  |
 |               |                        |--link Account if new |
 |               |                        |--create Session      |
 |               |                        |--set session cookie  |
 |               |                        |                      |
 |<--------------|-302 redirect to callbackURL (/)               |
 |               |                        |                      |
 |--page load--->|                        |                      |
 |               |--checkSession()------->|                      |
 |               |  GET /auth/session-info|                      |
 |               |<--{ user, tier }-------|                      |
 |<--dashboard---|                        |                      |
```

### 3.2 Google Sign-Up (new user — triggers trial hook)

```
User        Frontend (Vue)       API (Fastify/BetterAuth)     Google
 |               |                        |                      |
 |--click btn--->|                        |                      |
 |               |--location.href-------->|                      |
 |               |  /api/auth/sign-in/    |                      |
 |               |  social?provider=      |                      |
 |               |  google&               |                      |
 |               |  newUserCallbackURL=   |                      |
 |               |  /onboarding/plan      |                      |
 |               |                        |--302 to Google------>|
 |<--------------|---------redirect to Google consent----------->|
 |                                                               |
 |--user grants consent----------------------------------------->|
 |               |                        |<--code callback------|
 |               |                        |                      |
 |               |                        |--exchange code------>|
 |               |                        |<--tokens + profile---|
 |               |                        |                      |
 |               |                        |--no user found       |
 |               |                        |--CREATE User         |
 |               |                        |   name: Google name  |
 |               |                        |   email: Google email|
 |               |                        |                      |
 |               |                        |--databaseHooks.user  |
 |               |                        |  .create.after fires |
 |               |                        |--createTrialSub()    |
 |               |                        |  21-day TRIALING     |
 |               |                        |                      |
 |               |                        |--CREATE Account      |
 |               |                        |  providerId: google  |
 |               |                        |--CREATE Session      |
 |               |                        |--set session cookie  |
 |               |                        |                      |
 |<--------------|-302 to newUserCallbackURL (/onboarding/plan)  |
 |               |                        |                      |
 |--page load--->|                        |                      |
 |               |--checkSession()------->|                      |
 |               |<--{ user, tier:FREE,   |                      |
 |               |   status:TRIALING }    |                      |
 |<--onboarding--|                        |                      |
```

### 3.3 Google Sign-In (email matches existing email+password user — auto-link)

```
User        Frontend (Vue)       API (BetterAuth)
 |               |                     |
 |--click btn--->|                     |
 |               |--redirect---------->|
 |               |                     |--Google OAuth flow-->
 |               |                     |<--email: foo@bar.com
 |               |                     |
 |               |                     |--find user by email
 |               |                     |  FOUND (email+pwd)
 |               |                     |
 |               |                     |--CREATE Account
 |               |                     |  providerId: google
 |               |                     |  userId: existing-id
 |               |                     |  (NO new User created)
 |               |                     |  (NO trial hook fires)
 |               |                     |
 |               |                     |--CREATE Session
 |               |                     |--set cookie
 |<--------------|-302 to callbackURL  |
```

---

## 4. BetterAuth Integration Details

### 4.1 Social Provider Configuration

BetterAuth's `socialProviders.google` accepts:
- `clientId` (string, required) — From Google Cloud Console
- `clientSecret` (string, required) — From Google Cloud Console
- `redirectURI` (string, optional) — Defaults to `{baseURL}/api/auth/callback/google`
- `scope` (string, optional) — Defaults to `openid email profile`
- `mapProfileToUser` (function, optional) — Custom profile mapping
- `prompt` (string, optional) — e.g., `"select_account"` to force account picker

We use defaults for `redirectURI` (BetterAuth auto-generates from `baseURL`) and `scope`.

### 4.2 Frontend Sign-In URL

BetterAuth exposes `GET /api/auth/sign-in/social` with query params:
- `provider` — `"google"`
- `callbackURL` — Where to redirect after successful auth (relative to frontend)
- `errorCallbackURL` — Where to redirect on error (optional)
- `newUserCallbackURL` — Where to redirect if the user is newly created (optional, falls back to `callbackURL`)

The frontend does a full-page redirect: `window.location.href = '...'`. No fetch/XHR needed.

### 4.3 Callback URL

The Google OAuth callback URL must be registered in Google Cloud Console:
```
{BETTER_AUTH_URL}/api/auth/callback/google
```

For local development: `http://localhost:3000/api/auth/callback/google`
For Docker dev: `http://localhost:3000/api/auth/callback/google`

This is auto-derived from `baseURL` in BetterAuth config. No explicit `redirectURI` config needed.

### 4.4 `databaseHooks.user.create.after` for Trial Provisioning

The hook fires AFTER a new `User` row is inserted. It receives the created user object:
```typescript
{
  id: string
  email: string
  name: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}
```

The hook is async. BetterAuth awaits it before completing the response. We wrap the trial creation in try/catch to prevent trial failures from blocking user creation.

### 4.5 Account Linking Behavior

Default BetterAuth behavior when `socialProviders.google` is configured:
1. User clicks "Sign in with Google"
2. BetterAuth receives Google profile (email, name, picture)
3. BetterAuth checks: does a `User` with this email exist?
   - **YES**: Creates new `Account` (providerId: "google") linked to existing User. `databaseHooks.user.create.after` does NOT fire (no new user). Session created.
   - **NO**: Creates new `User` + new `Account`. `databaseHooks.user.create.after` FIRES. Session created.

To disable auto-linking (not needed for MVP): set `disableImplicitSignUp: true` on the Google provider config.

### 4.6 Name Fallback

Google always provides `name` in the profile. BetterAuth maps it to `User.name` automatically. However, as a safety net:

The `databaseHooks.user.create.before` hook can ensure name is never null:
```typescript
before: async (user) => {
  if (!user.name) {
    return {
      data: {
        ...user,
        name: user.email.split('@')[0],
      },
    }
  }
  // Return nothing to use user as-is
}
```

This is a defensive measure — Google profiles always include a display name, but edge cases (privacy settings, service accounts) could theoretically omit it.

---

## 5. Error Handling

### 5.1 Google Auth Failure

**Scenario**: User denies consent, Google returns an error, or the OAuth state is invalid.

**Handling**: BetterAuth redirects to `errorCallbackURL` (if provided) or `callbackURL` with an `error` query parameter.

**Frontend strategy**:
- Set `errorCallbackURL` to `/auth/login?error=google_auth_failed`
- On LoginPage mount, check `route.query.error` and display a banner
- Same pattern for SignupPage

### 5.2 Missing Env Vars (Google Not Configured)

**Scenario**: `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is not set.

**Handling**:
- Server: Google provider is not registered with BetterAuth. The `/api/auth/sign-in/social?provider=google` endpoint returns 404 or error.
- Frontend: For MVP, button is always shown. If the server returns an error, the user is redirected back with an error param.
- Future: Expose `/api/auth/providers` endpoint listing enabled providers. Frontend hides Google button when not in list.

### 5.3 Name Missing from Google Profile

**Scenario**: Rare — Google profile lacks display name.

**Handling**: `databaseHooks.user.create.before` hook checks for missing name and falls back to email prefix (`email.split('@')[0]`). This ensures the `User.name` NOT NULL constraint is always satisfied.

### 5.4 Trial Provisioning Failure

**Scenario**: `createTrialSubscription` throws (DB error, constraint violation).

**Handling**: The `databaseHooks.user.create.after` hook catches the error and logs it. The user is still created successfully. They can trigger trial provisioning later from the pricing page or by contacting support.

### 5.5 Duplicate Account Linking

**Scenario**: User already has a Google account linked and clicks "Sign in with Google" again.

**Handling**: BetterAuth recognizes the existing `Account` row (providerId: "google") and simply creates a new session. No new Account or User is created.

---

## 6. Testing Strategy

### 6.1 Unit Tests

- **`auth.config.ts`**: Test that `googleEnabled` is true only when both env vars are set. Test that the config object includes/excludes `socialProviders` accordingly.
- **`databaseHooks.user.create.after`**: Test that `createTrialSubscription` is called with correct args. Test that errors are caught and logged.
- **`authStore.ts`**: Test that `signInWithGoogle()` sets `window.location.href` to the correct URL with encoded params.

### 6.2 Integration Tests

- **OAuth callback flow**: Mock Google's token endpoint, verify User + Account + Session + Subscription are created.
- **Account linking**: Create email+password user, then simulate Google callback with same email. Verify no duplicate User, new Account linked.

### 6.3 Manual Testing

- Full redirect flow with real Google credentials in Docker dev environment
- Verify trial is provisioned after first Google sign-in
- Verify second Google sign-in doesn't create duplicate trial
- Verify email+password user can also sign in with Google (same email)

---

## 7. File Change Summary

| File | Action | Lines Changed (est.) |
|------|--------|---------------------|
| `apps/api/src/modules/auth/auth.config.ts` | Modify | +25, -5 |
| `apps/web/src/shared/stores/authStore.ts` | Modify | +15, -0 |
| `apps/web/src/modules/auth/LoginPage.vue` | Modify | +2, -2 |
| `apps/web/src/modules/auth/SignupPage.vue` | Modify | +15, -5 |
| `docker-compose.override.yml` | Modify | +3, -0 |
| `.env.example` | Create | +20 |

**Total estimated**: ~80 lines added/modified across 6 files. No new dependencies. No database migrations.
