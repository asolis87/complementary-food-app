# Google OAuth Authentication — Task Breakdown

**Change**: google-oauth-authentication
**Date**: 2026-04-14
**Total files affected**: 6 (auth.config.ts, authStore.ts, LoginPage.vue, SignupPage.vue, docker-compose.override.yml, .env.example)
**Estimated lines**: ~80 net additions

---

## Phase 1: Infrastructure

### Task 1.1 — Add Google OAuth env vars to docker-compose.override.yml

**Files affected**:
- `docker-compose.override.yml`

**Requirements covered**:
- REQ-GOAUTH-04 (guard requires both vars)
- REQ-GOAUTH-07 (app starts normally without vars)
- REQ-GOAUTH-08 (.env.example documents vars)

**Dependencies**: none

**What to do**:
Add commented-out `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars to the `api` service section in `docker-compose.override.yml`. They must be commented by default so the app starts without them.

```yaml
# GOOGLE_CLIENT_ID: your-client-id
# GOOGLE_CLIENT_SECRET: your-client-secret
```

**Acceptance criteria**:
- `docker-compose.override.yml` has both vars commented under the `api` service
- Running `docker compose up` without uncommenting them does NOT break the app
- The `# Register callback: https://{BETTER_AUTH_URL}/api/auth/callback/google` comment is present

---

### Task 1.2 — Create .env.example at repo root

**Files affected**:
- `.env.example` (new file)

**Requirements covered**:
- REQ-GOAUTH-08 (document all vars including redirect URI comment)

**Dependencies**: none

**What to do**:
Create `.env.example` at the repo root documenting all required and optional env vars for both `apps/api` and `apps/web`. Include Google OAuth section with callback URL pattern comment.

Required sections:
- API vars: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`
- Google OAuth (optional): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Comment: `# Callback URI to register in Google Cloud Console: {BETTER_AUTH_URL}/api/auth/callback/google`
- Web vars: `VITE_API_BASE_URL`

**Acceptance criteria**:
- File exists at repo root as `.env.example`
- Google OAuth vars are clearly marked as optional
- Callback URI comment is present with the correct BetterAuth pattern
- No actual secrets in the file (only placeholder values)

---

## Phase 2: Backend Implementation

### Task 2.1 — Harden auth.config.ts: require both Google env vars

**Files affected**:
- `apps/api/src/modules/auth/auth.config.ts`

**Requirements covered**:
- REQ-GOAUTH-04 (guard: both GOOGLE_CLIENT_ID AND GOOGLE_CLIENT_SECRET required)
- REQ-GOAUTH-07 (email/password unaffected; app starts without OAuth vars)

**Dependencies**: 1.1

**What to do**:
Replace the current broken guard (only checks `GOOGLE_CLIENT_ID`, defaults secret to `''`) with a hardened guard that requires both vars. Add a `console.warn` when only one is set.

Current (broken):
```ts
...(process.env['GOOGLE_CLIENT_ID'] && {
  socialProviders: {
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    },
  },
}),
```

Target pattern:
```ts
const googleClientId = process.env['GOOGLE_CLIENT_ID']
const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET']
const googleEnabled = !!googleClientId && !!googleClientSecret

if ((googleClientId && !googleClientSecret) || (!googleClientId && googleClientSecret)) {
  console.warn('[auth] Google OAuth: only one of GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET is set. Both are required. Google sign-in is DISABLED.')
}

...(googleEnabled && {
  socialProviders: {
    google: {
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
    },
  },
}),
```

**Acceptance criteria**:
- When both vars are set → `socialProviders.google` is registered
- When only one var is set → warn + Google disabled (no provider registered)
- When neither var is set → silent, Google disabled
- TypeScript strict: no `!` casts unless after the `googleEnabled` guard

---

### Task 2.2 — Add databaseHooks.user.create lifecycle for trial provisioning + name fallback

**Files affected**:
- `apps/api/src/modules/auth/auth.config.ts`
- (reads) `apps/api/src/modules/billing/billing.service.ts`

**Requirements covered**:
- REQ-GOAUTH-02 (BetterAuth sets emailVerified=true; populate name from Google profile with email fallback)
- REQ-GOAUTH-03 (onUserCreated: createTrialSubscription; errors swallowed, never block sign-in)

**Dependencies**: 2.1

**What to do**:
Add `databaseHooks` block to `betterAuth({...})` config:

1. `user.create.before` — name fallback: if `user.name` is null/empty, set it to the email prefix (before `@`). Prevents NOT NULL constraint violation.
2. `user.create.after` — trial provisioning: call `createTrialSubscription(prisma, { userId: user.id, plan: 'TRIAL' })` wrapped in try/catch. Log error, never rethrow.

Import `createTrialSubscription` from `../../billing/billing.service.js`.

**Key constraint from design (AD-GOAUTH-02)**:
- `databaseHooks.user.create.after` fires ONLY on new user creation — not on subsequent OAuth sign-ins for existing users. This is safe for deduplication.
- The `prisma` instance is already declared at the top of `auth.config.ts` — reuse it.

**Acceptance criteria**:
- New OAuth user with missing name → gets `email.split('@')[0]` as name
- New OAuth user (or email signup user) → trial subscription created via `createTrialSubscription`
- Trial creation error → error logged to console, user still created, `user.create.after` returns without throwing
- Existing OAuth user signs in again → hook does NOT fire, no duplicate trial
- TypeScript: `createTrialSubscription` properly imported with correct signature

---

### Task 2.3 — Write backend tests for auth.config.ts changes

**Files affected**:
- `apps/api/src/modules/auth/auth.config.test.ts` (new file)

**Requirements covered**:
- REQ-GOAUTH-04, REQ-GOAUTH-03, REQ-GOAUTH-02

**Dependencies**: 2.1, 2.2

**What to do**:
Create `auth.config.test.ts` with vitest unit tests covering:

1. **env guard — both vars set** → `socialProviders.google` present in config
2. **env guard — only GOOGLE_CLIENT_ID set** → warn logged, google not in socialProviders
3. **env guard — only GOOGLE_CLIENT_SECRET set** → warn logged, google not in socialProviders
4. **env guard — neither var set** → no warn, google not in socialProviders
5. **user.create.before — no name** → name set to email prefix
6. **user.create.before — name present** → name unchanged
7. **user.create.after — success** → `createTrialSubscription` called with `{ userId, plan: 'TRIAL' }`
8. **user.create.after — error** → error logged, no rethrow (promise resolves)

Use `vi.mock` to mock `billing.service.ts`. Use `vi.stubEnv` or env manipulation for env var tests (restore after each test).

**Acceptance criteria**:
- All 8 tests pass (`pnpm --filter api test`)
- No real DB connections — mock prisma adapter
- Tests cover the warn path with `vi.spyOn(console, 'warn')`

---

## Phase 3: Frontend Implementation

### Task 3.1 — Add signInWithGoogle() action to authStore.ts

**Files affected**:
- `apps/web/src/shared/stores/authStore.ts`

**Requirements covered**:
- REQ-GOAUTH-01 (redirect flow via window.location.href)
- REQ-GOAUTH-05 (LoginPage and SignupPage call authStore.signInWithGoogle())
- REQ-GOAUTH-06 (callbackURL = FRONTEND_URL; new OAuth users land on /)

**Dependencies**: none (can run in parallel with Phase 2)

**What to do**:
Add a synchronous `signInWithGoogle()` action to the store. It must:

- Read the API base URL from `import.meta.env.VITE_API_BASE_URL` (same mechanism as `apiClient`)
- Build the URL: `{VITE_API_BASE_URL}/api/auth/sign-in/social?provider=google&callbackURL=/&newUserCallbackURL=/onboarding/plan`
- Set `window.location.href` to that URL
- NOT set `loading.value = true` (it's a navigation, not an async op)
- NOT have a try/catch (navigation failure is handled by server redirect to errorCallbackURL)

```ts
function signInWithGoogle(): void {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string
  window.location.href = `${apiBase}/api/auth/sign-in/social?provider=google&callbackURL=/&newUserCallbackURL=/onboarding/plan`
}
```

Export it in the return object.

**Acceptance criteria**:
- `signInWithGoogle` is exported from the store
- It does NOT touch `loading` or `error` refs
- TypeScript strict: no implicit `any`
- The URL pattern matches the design exactly (provider=google, callbackURL=/, newUserCallbackURL=/onboarding/plan)

---

### Task 3.2 — Wire handleGoogleLogin() in LoginPage.vue

**Files affected**:
- `apps/web/src/modules/auth/LoginPage.vue`

**Requirements covered**:
- REQ-GOAUTH-05 (LoginPage handleGoogleLogin() → authStore.signInWithGoogle())

**Dependencies**: 3.1

**What to do**:
In `LoginPage.vue`, find the existing `handleGoogleLogin()` function (or the Google button handler) and wire it to `authStore.signInWithGoogle()`. Minimal change: 2 lines changed.

**Acceptance criteria**:
- Clicking the Google button in LoginPage calls `authStore.signInWithGoogle()`
- No other behaviour in LoginPage is affected
- No loading spinner triggered for this action

---

### Task 3.3 — Wire handleGoogleSignup() + fix icon in SignupPage.vue

**Files affected**:
- `apps/web/src/modules/auth/SignupPage.vue`

**Requirements covered**:
- REQ-GOAUTH-05 (SignupPage handleGoogleSignup() → authStore.signInWithGoogle(); fix icon from Material 'language' to Google SVG)

**Dependencies**: 3.1

**What to do**:
1. Wire `handleGoogleSignup()` to `authStore.signInWithGoogle()` — same endpoint as LoginPage (BetterAuth handles new vs existing).
2. Replace the `icon="language"` Material icon with the same Google SVG used in LoginPage (inline SVG or shared component). Match visual style of the LoginPage Google button.

**Acceptance criteria**:
- Clicking the Google button in SignupPage calls `authStore.signInWithGoogle()`
- Google button shows the correct Google logo (not the Material 'language' globe icon)
- Visual style matches the LoginPage Google button
- No other behaviour in SignupPage is affected

---

### Task 3.4 — Conditional visibility: hide Google buttons when OAuth not configured (optional/deferred)

**Files affected**:
- `apps/web/src/modules/auth/LoginPage.vue`
- `apps/web/src/modules/auth/SignupPage.vue`

**Requirements covered**:
- REQ-GOAUTH-07 (buttons stay visible; per spec: server returns error if not configured — frontend always shows buttons for MVP)

**Dependencies**: 3.2, 3.3

**What to do**:
Per REQ-GOAUTH-07 and the spec: for MVP, always show Google buttons. The server returns an error if OAuth is not configured. No frontend env-var check needed at this stage.

> **This task is MVP-deferred**: keep the buttons always visible. Only implement conditional hiding in a future iteration if UX feedback requires it.

**Acceptance criteria**:
- Google buttons are always visible regardless of env vars
- No `VITE_GOOGLE_ENABLED` env var introduced at this stage

---

### Task 3.5 — Write frontend tests for authStore signInWithGoogle

**Files affected**:
- `apps/web/src/shared/stores/authStore.test.ts` (new file or extend if exists)

**Requirements covered**:
- REQ-GOAUTH-01, REQ-GOAUTH-05

**Dependencies**: 3.1

**What to do**:
Add vitest tests for the new `signInWithGoogle` action:

1. **navigates to correct URL** → mock `window.location` (or use `vi.stubGlobal`), call `signInWithGoogle()`, assert `window.location.href` equals the expected URL with `VITE_API_BASE_URL` prefix
2. **does not set loading** → assert `authStore.loading` remains `false` before and after call
3. **does not set error** → assert `authStore.error` remains `null`

Use `vi.stubEnv` for `VITE_API_BASE_URL`. Mock `window.location.href` assignment using `Object.defineProperty` or `vi.stubGlobal`.

**Acceptance criteria**:
- All 3 tests pass (`pnpm --filter web test`)
- Tests are isolated — no real navigation occurs

---

## Phase 4: Documentation & Verification

### Task 4.1 — Verify .env.example completeness

**Files affected**:
- `.env.example` (from Task 1.2)

**Requirements covered**:
- REQ-GOAUTH-08

**Dependencies**: 1.2, 2.1, 2.2, 3.1

**What to do**:
Final review of `.env.example` to ensure all env vars used in the implementation are documented:
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, `CORS_ORIGIN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional, with callback comment)
- `VITE_API_BASE_URL`

**Acceptance criteria**:
- Every env var referenced in changed files is present in `.env.example`
- Google OAuth section has the callback URI comment: `# Register in Google Cloud Console: {BETTER_AUTH_URL}/api/auth/callback/google`

---

### Task 4.2 — Typecheck passes across monorepo

**Files affected**: none (validation only)

**Requirements covered**: all (quality gate)

**Dependencies**: 2.1, 2.2, 3.1, 3.2, 3.3

**What to do**:
Run `pnpm typecheck` (or `pnpm --filter api tsc --noEmit && pnpm --filter web tsc --noEmit`) and fix any TypeScript errors introduced by the changes.

Common pitfalls to check:
- `createTrialSubscription` import path uses `.js` extension (ESM)
- `googleClientId!` and `googleClientSecret!` non-null assertions only inside the `googleEnabled` guard
- `import.meta.env.VITE_API_BASE_URL` typed as `string` (cast if needed)

**Acceptance criteria**:
- `pnpm typecheck` exits with code 0
- No `any` introduced
- No `// @ts-ignore` added

---

### Task 4.3 — Full test suite passes

**Files affected**: none (validation only)

**Requirements covered**: all (quality gate)

**Dependencies**: 2.3, 3.5, 4.2

**What to do**:
Run the full test suite: `pnpm test` across all workspaces.

**Acceptance criteria**:
- All existing tests still pass (no regressions)
- New tests from Task 2.3 and 3.5 pass
- No skipped tests related to auth or billing

---

## Dependency Graph

```
1.1 ──────────────────────────── 2.1 ──── 2.2 ──── 2.3
                                                        \
1.2 ──────────────────────────────────────────────────── 4.1 ──── 4.2 ──── 4.3
                                                        /          /
3.1 ──── 3.2 ──────────────────────────────────────────         /
    \─── 3.3 ──── 3.4 (deferred)                               /
    \─── 3.5 ───────────────────────────────────────────────────
```

Phases 1 and 3 can start in parallel. Phase 2 depends on 1.1 for completeness but 2.1 can be read/written before docker-compose is updated. Phase 4 depends on all implementation tasks.

---

## Summary Table

| Task | Title | Files | REQs | Deps |
|------|-------|-------|------|------|
| 1.1 | Add Google env vars to docker-compose | docker-compose.override.yml | 04, 07, 08 | — |
| 1.2 | Create .env.example | .env.example | 08 | — |
| 2.1 | Harden auth.config.ts env guard | auth.config.ts | 04, 07 | 1.1 |
| 2.2 | Add databaseHooks for trial + name fallback | auth.config.ts | 02, 03 | 2.1 |
| 2.3 | Backend tests for auth.config | auth.config.test.ts | 02, 03, 04 | 2.1, 2.2 |
| 3.1 | Add signInWithGoogle() to authStore | authStore.ts | 01, 05, 06 | — |
| 3.2 | Wire handleGoogleLogin() in LoginPage | LoginPage.vue | 05 | 3.1 |
| 3.3 | Wire handleGoogleSignup() + fix icon in SignupPage | SignupPage.vue | 05 | 3.1 |
| 3.4 | Conditional visibility (MVP-deferred) | LoginPage.vue, SignupPage.vue | 07 | 3.2, 3.3 |
| 3.5 | Frontend tests for authStore | authStore.test.ts | 01, 05 | 3.1 |
| 4.1 | Verify .env.example completeness | .env.example | 08 | 1.2, 2.x, 3.x |
| 4.2 | Typecheck passes | — | all | 2.x, 3.x |
| 4.3 | Full test suite passes | — | all | 2.3, 3.5, 4.2 |
