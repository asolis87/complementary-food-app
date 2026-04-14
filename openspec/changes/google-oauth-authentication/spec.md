# Google OAuth Authentication — Spec

**Change**: google-oauth-authentication
**Status**: specs complete
**Date**: 2026-04-14

---

## Requirements

### REQ-GOAUTH-01: Google OAuth Sign-In Redirect Flow

The system MUST provide a Google OAuth sign-in entry point reachable via HTTP redirect.

**Acceptance criteria**:

1. The backend route `GET /api/auth/sign-in/google` MUST redirect the browser to Google's OAuth 2.0 authorization endpoint.
2. The redirect MUST include the correct `client_id`, `redirect_uri`, and `scope` (at minimum `openid email profile`). BetterAuth handles this automatically when the provider is configured.
3. The frontend MUST initiate the flow via `window.location.href` — NOT via `fetch` or `axios`. No BetterAuth client SDK is required.
4. `authStore.signInWithGoogle()` MUST construct the redirect URL as `{BETTER_AUTH_URL}/api/auth/sign-in/google` and assign it to `window.location.href`.
5. The Google button in `LoginPage.vue` MUST call `authStore.signInWithGoogle()` on click.
6. The Google button in `SignupPage.vue` MUST call `authStore.signInWithGoogle()` on click.
7. Both buttons MUST be disabled while `authStore.loading` is `true`.

---

### REQ-GOAUTH-02: Google OAuth Callback Handling and Session Creation

The system MUST process the Google OAuth callback and establish an authenticated session.

**Acceptance criteria**:

1. BetterAuth MUST handle `GET /api/auth/callback/google` automatically when the `google` social provider is configured.
2. Upon successful callback, BetterAuth MUST create or retrieve the `User` record, create or update the `Account` record with `providerId = 'google'`, and issue a session cookie.
3. The `Account` record MUST store `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, and `scope` as provided by Google. These fields already exist in the Prisma schema.
4. BetterAuth MUST redirect the browser to `FRONTEND_URL` (or the configured `callbackURL`) after a successful callback.
5. After the redirect, the frontend app's existing `checkSession()` on mount MUST restore the session by reading the session cookie.
6. The `User.name` field MUST be populated from the Google profile (`given_name + family_name`). If Google returns an empty or null name, the system MUST fall back to the Google account email as the display name.
7. `User.emailVerified` MUST be set to `true` for all OAuth users — Google already verified the address.

---

### REQ-GOAUTH-03: Auto-Trial Provisioning for OAuth Signups (Server-Side)

The system MUST automatically provision a 21-day TRIALING subscription for every new user created via Google OAuth.

**Acceptance criteria**:

1. Trial provisioning MUST occur server-side via BetterAuth's `onUserCreated` lifecycle hook in `auth.config.ts` — NOT on the frontend.
2. The hook MUST call `createTrialSubscription(prisma, { userId, plan: 'TRIAL' })` from `billing.service.ts` — the same function used by `POST /api/billing/start-trial`.
3. The hook MUST only provision a trial for **newly created** users. Returning OAuth users (account already in `Account` table) MUST NOT receive a second trial.
4. BetterAuth's `onUserCreated` hook MUST be used as the detection mechanism for "new user" (it fires exactly once per user creation, not on subsequent sign-ins).
5. If `createTrialSubscription` throws a `ConflictError` (user already has ACTIVE or TRIALING subscription), the hook MUST silently swallow the error and continue. The session MUST NOT be rejected.
6. If `createTrialSubscription` throws any other error, the hook MUST log the error (`console.error`) and continue. Trial creation failure MUST NOT block sign-in.
7. After a successful OAuth signup + hook execution, `GET /api/auth/session-info` MUST return `subscriptionStatus: 'TRIALING'` and a non-null `trialEnd` date 21 days in the future.

---

### REQ-GOAUTH-04: Auth Config Hardening — Require Both Client ID and Secret

The system MUST NOT activate the Google OAuth provider unless both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables are set to non-empty strings.

**Acceptance criteria**:

1. The guard in `auth.config.ts` MUST be:
   ```ts
   const googleEnabled =
     Boolean(process.env['GOOGLE_CLIENT_ID']) &&
     Boolean(process.env['GOOGLE_CLIENT_SECRET'])
   ```
2. If only `GOOGLE_CLIENT_ID` is set (without `GOOGLE_CLIENT_SECRET`), the `socialProviders` block MUST NOT be included in the BetterAuth config. The current behavior of activating with an empty string secret MUST be removed.
3. If only `GOOGLE_CLIENT_SECRET` is set (without `GOOGLE_CLIENT_ID`), same rule applies — the provider MUST NOT activate.
4. When neither variable is set, the application MUST start normally. The Google OAuth routes will return 404 or an appropriate error from BetterAuth.
5. When only one of the two variables is set, the system SHOULD log a `console.warn` explaining which variable is missing. This prevents silent misconfiguration in production.

---

### REQ-GOAUTH-05: Frontend Google Button Wiring

The system MUST present a functional Google sign-in/sign-up button in both `LoginPage.vue` and `SignupPage.vue`.

**Acceptance criteria**:

1. `LoginPage.vue` already has a Google icon button (`google-icon-btn`). The `handleGoogleLogin()` function MUST call `authStore.signInWithGoogle()` instead of the current no-op.
2. `SignupPage.vue` has a Google button using `icon="language"` (Material Symbols globe icon). This MUST be replaced with the same Google SVG used in `LoginPage.vue` — four-color Google "G" logo.
3. `SignupPage.vue`'s `handleGoogleSignup()` MUST call `authStore.signInWithGoogle()` instead of the current no-op.
4. Both pages MUST use the same `authStore.signInWithGoogle()` action. The distinction between "login" and "signup" is irrelevant — BetterAuth creates-or-links the account automatically.
5. `authStore.ts` MUST export a new `signInWithGoogle()` action. This action MUST NOT set `loading = true` (it's a page navigation, not an async request). It MUST assign `window.location.href`.
6. The `signInWithGoogle()` action MUST be included in the `return` object of the `defineStore` factory alongside the existing actions.

---

### REQ-GOAUTH-06: Post-OAuth Redirect to App with Session

The system MUST redirect the user back to the frontend application with an active session after a successful Google OAuth flow.

**Acceptance criteria**:

1. BetterAuth MUST be configured with `callbackURL` pointing to `FRONTEND_URL` (e.g. `http://localhost:5174` in development, the production frontend URL in production).
2. After the redirect, the existing `App.vue` `onMounted` → `authStore.checkSession()` call MUST restore the user's session from the session cookie without any additional frontend code.
3. New OAuth users MUST land on `/` (root). They MUST NOT be redirected to `/onboarding/plan` — the trial is already active from the server-side hook.
4. The session cookie MUST be set with `httpOnly: true` and `secure: true` in production (handled by `useSecureCookies: process.env['NODE_ENV'] === 'production'` which already exists in `auth.config.ts`).
5. `GET /api/auth/session-info` called after the redirect MUST return the user object with `subscriptionStatus: 'TRIALING'` for new users and their existing subscription status for returning users.

---

### REQ-GOAUTH-07: Graceful Degradation When Google OAuth Is Not Configured

The system MUST behave predictably when Google OAuth environment variables are not set.

**Acceptance criteria**:

1. If `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not set, the application backend MUST start without errors.
2. Clicking the Google button when the provider is not configured MUST result in a visible error — either a redirect to an error page from BetterAuth, or a user-facing error message. The application MUST NOT silently freeze.
3. The Google buttons in `LoginPage.vue` and `SignupPage.vue` MUST remain visible regardless of server-side config — the env var check is a server concern, not a frontend concern. (Hiding the buttons based on env vars is out of scope for MVP.)
4. `POST /api/billing/start-trial` MUST continue to work independently of Google OAuth configuration — the existing email signup flow MUST NOT be affected by this change.
5. Existing email/password authentication (`signIn`, `signUp`, `signOut`) MUST continue to function identically regardless of whether Google OAuth is configured.

---

### REQ-GOAUTH-08: Environment Variable Documentation

The system MUST document all environment variables required for Google OAuth in the project's configuration reference.

**Acceptance criteria**:

1. A `.env.example` file MUST be created at the repository root documenting all auth-related env vars, including:
   - `BETTER_AUTH_URL` — Base URL for BetterAuth routes (e.g. `http://localhost:3001`)
   - `BETTER_AUTH_SECRET` — Secret key for signing sessions (min 32 chars)
   - `FRONTEND_URL` — Frontend URL for post-OAuth redirect (e.g. `http://localhost:5174`)
   - `CORS_ORIGIN` — Additional CORS origin (e.g. `http://localhost:5173`)
   - `GOOGLE_CLIENT_ID` — Google Cloud Console OAuth 2.0 client ID
   - `GOOGLE_CLIENT_SECRET` — Google Cloud Console OAuth 2.0 client secret
2. The file MUST include a comment explaining the required Google Cloud Console Authorized Redirect URI:
   `{BETTER_AUTH_URL}/api/auth/callback/google`
3. The file MUST include a comment warning that `BETTER_AUTH_SECRET` must be at least 32 characters and kept secret.
4. `docker-compose.override.yml` MUST include `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as commented-out entries so developers know to add them without the app failing at startup.
5. The variables MUST be documented without real values — placeholder or example format only (e.g. `GOOGLE_CLIENT_ID=your-client-id-here`).

---

## Acceptance Scenarios

### Scenario 1 — Happy path: New user signs up via Google (LoginPage)

```
Given GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
And the user has never created an account on Pakulab
And the user is on LoginPage

When the user clicks the Google icon button
Then window.location.href is assigned to "{BETTER_AUTH_URL}/api/auth/sign-in/google"
And the browser redirects to Google's consent screen

When the user grants consent on Google's screen
Then BetterAuth receives the callback at GET /api/auth/callback/google
And BetterAuth creates a new User record with email and name from the Google profile
And BetterAuth creates an Account record with providerId = 'google'
And the onUserCreated hook fires
And createTrialSubscription is called with { userId, plan: 'TRIAL' }
And a Subscription record is created with status = 'TRIALING' and trialEnd = now + 21 days
And BetterAuth sets a session cookie and redirects to FRONTEND_URL

When the browser lands on FRONTEND_URL
Then App.vue calls authStore.checkSession()
And GET /api/auth/session-info returns { user: { name, email, tier, subscriptionStatus: 'TRIALING', trialEnd }, tier: 'FREE' }
And the user is authenticated and lands on /
```

---

### Scenario 2 — Happy path: Existing user signs in via Google (returning OAuth user)

```
Given GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
And the user already has an Account with providerId = 'google' linked to their User
And the user has an existing TRIALING subscription

When the user clicks the Google button on LoginPage or SignupPage
And completes the Google consent flow
Then BetterAuth finds the existing Account and User records
And the onUserCreated hook does NOT fire (user is not new)
And the existing Subscription is NOT modified
And BetterAuth sets a session cookie and redirects to FRONTEND_URL

When the browser lands on FRONTEND_URL
Then authStore.checkSession() restores the session
And the user's existing subscriptionStatus and trialEnd are returned unchanged
```

---

### Scenario 3 — Error path: Google returns an auth error (access denied or cancelled)

```
Given GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
And the user is on LoginPage

When the user clicks the Google button
And the user denies consent on Google's screen (or an error occurs on Google's side)
Then BetterAuth receives an error callback
And BetterAuth redirects to FRONTEND_URL with an error indicator (query param or error route)
And the frontend renders a visible error message (via authStore.error or the error-banner component)
And the user remains unauthenticated
And no User, Account, or Subscription records are created
```

---

### Scenario 4 — Edge case: User with existing email signs in via Google for first time (account linking)

```
Given a User record exists with email = 'ana@example.com' created via email/password signup
And no Account record exists with providerId = 'google' for this user

When the user signs in via Google using the same 'ana@example.com' email
Then BetterAuth auto-links the Google account to the existing User record
And a new Account record is created with providerId = 'google'
And the onUserCreated hook does NOT fire (the User was not newly created)
And the existing Subscription (TRIALING or otherwise) is NOT modified
And the user is authenticated as the same existing user
```

> **Note**: BetterAuth's default behavior is to link accounts by email. This is correct. No custom UI is needed. This is not a conflict — it is transparent to the user.

---

### Scenario 5 — Edge case: Google profile has no display name

```
Given a new user authenticates via Google
And Google's profile returns an empty or null name (edge case with some Google Workspace accounts)

When BetterAuth creates the User record
Then User.name MUST be set to the user's email address as a fallback
And User.name MUST NOT be null or empty string (since the DB column is NOT NULL)
And the authStore displayName computed returns the email as the fallback display name
```

---

### Scenario 6 — Graceful degradation: Google OAuth not configured

```
Given GOOGLE_CLIENT_ID is not set in the environment (or GOOGLE_CLIENT_SECRET is missing)
And the googleEnabled guard in auth.config.ts evaluates to false

When the API server starts
Then the server starts without errors
And the socialProviders block is absent from the BetterAuth config

When the user clicks the Google button on LoginPage or SignupPage
Then the browser navigates to "{BETTER_AUTH_URL}/api/auth/sign-in/google"
And the server returns a 404 or BetterAuth error response
And the browser is redirected to FRONTEND_URL with an error indicator
And the user sees an error message

And the email/password flows (signIn, signUp, signOut) work exactly as before
```

---

### Scenario 7 — Graceful degradation: Only one Google env var is set

```
Given GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is not (or vice versa)

When the API server starts
Then a console.warn is logged indicating which variable is missing
And the socialProviders block is absent from the BetterAuth config (same as Scenario 6)
And the server does NOT start with an empty clientSecret (which would cause silent failures)
```

---

### Scenario 8 — Trial provisioning: hook error does not block sign-in

```
Given a new user completes Google OAuth for the first time
And the onUserCreated hook fires
And createTrialSubscription throws an unexpected error (e.g. DB connection issue)

When the hook catches the error
Then the error is logged via console.error
And the hook completes without re-throwing
And BetterAuth's session cookie is still set
And the user is redirected to FRONTEND_URL and successfully authenticated
And GET /api/auth/session-info returns the user with subscriptionStatus = null (no trial provisioned)

Then the user can manually start a trial from the PlanSelectionPage or PricingPage
```

---

### Scenario 9 — Trial provisioning: returning OAuth user does not get duplicate trial

```
Given a User already has subscriptionStatus = 'TRIALING'
And the user signs in via Google again (second or subsequent sign-in)

When BetterAuth processes the callback
Then onUserCreated does NOT fire
And createTrialSubscription is NOT called
And the existing Subscription record is unchanged
And the user's trialEnd is NOT reset or extended
```

---

### Scenario 10 — authStore.signInWithGoogle() action

```
Given the user is on any page that imports authStore

When authStore.signInWithGoogle() is called
Then window.location.href is set to "{BETTER_AUTH_URL}/api/auth/sign-in/google"
And authStore.loading remains false (this is a navigation, not an async operation)
And authStore.error is not set by this action
```

> **Note**: `BETTER_AUTH_URL` must be read from an env-aware config (e.g. `import.meta.env.VITE_API_BASE_URL` in Vite) — not hardcoded. Verify how other stores (`apiClient`) resolve the base URL and use the same mechanism.

---

### Scenario 11 — SignupPage icon fix

```
Given the user opens SignupPage

When the page renders
Then the Google button displays the four-color Google "G" SVG (same as LoginPage)
And the button does NOT display the Material Symbols 'language' (globe) icon
And clicking the button calls authStore.signInWithGoogle()
```

---

### Scenario 12 — .env.example documentation

```
Given a developer clones the repository for the first time

When they read .env.example
Then they can identify all required variables for Google OAuth: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
And they can read the comment explaining the required redirect URI in Google Cloud Console
And they can identify the BETTER_AUTH_SECRET minimum length requirement
And they can configure Google OAuth without reading source code
```
