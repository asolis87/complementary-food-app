# Tasks: Email Verification + Forgot Password

## Phase 1: Foundation — Email Module & Environment

- [x] 1.1 Create `apps/api/src/modules/email/domain/ports/email.port.ts` — `EmailPort` interface: `sendEmail(to, subject, htmlBody, textBody?): Promise<void>`
- [x] 1.2 Create `apps/api/src/modules/email/domain/ports/email.port.test.ts` — port contract test: verify `sendEmail` signature, confirm async return
- [x] 1.3 Create `apps/api/src/modules/email/infrastructure/adapters/console-log.adapter.ts` — `ConsoleLogAdapter` implements `EmailPort`, logs to console, resolves immediately
- [x] 1.4 Create `apps/api/src/modules/email/infrastructure/adapters/console-log.adapter.test.ts` — test: logs email fields, resolves without error
- [x] 1.5 Create `apps/api/src/modules/email/infrastructure/adapters/resend.adapter.ts` — `ResendAdapter` implements `EmailPort`, calls Resend API, catches and logs errors without throwing
- [x] 1.6 Create `apps/api/src/modules/email/infrastructure/adapters/resend.adapter.test.ts` — test: sends via Resend, catches delivery errors gracefully, env-gated integration test
- [x] 1.7 Create `apps/api/src/modules/email/infrastructure/templates/verification.template.ts` — HTML/text email template for verification link
- [x] 1.8 Create `apps/api/src/modules/email/infrastructure/templates/reset-password.template.ts` — HTML/text email template for password reset link
- [x] 1.9 Add `RESEND_API_KEY` to `apps/api/.env.example` and `.env` — required for ResendAdapter
- [x] 1.10 Add `RESET_PASSWORD_URL` and `VERIFY_EMAIL_URL` env vars to `.env.example` — frontend callback URLs for token links

## Phase 2: BetterAuth Plugin Configuration

- [ ] 2.1 Update `apps/api/src/modules/auth/auth.config.ts` — add `emailVerification` plugin config with `sendVerificationEmail` callback wired to `EmailPort`
- [ ] 2.2 Update `apps/api/src/modules/auth/auth.config.ts` — add `sendResetPassword` callback in `emailAndPassword` config wired to `EmailPort`
- [ ] 2.3 Update `apps/api/src/modules/auth/auth.config.ts` — set `emailAndPassword.requireEmailVerification: false` (soft gate per proposal, not hard block)
- [ ] 2.4 Create `apps/api/src/modules/auth/auth.config.test.ts` — test: verify emailVerification and sendResetPassword callbacks call emailPort.sendEmail, verify token expiry=3600

## Phase 3: Rate Limiting & Auth Route Updates

- [ ] 3.1 Update `apps/api/src/modules/auth/auth.routes.ts` — add rate-limit config (3 req/min per IP) on `/verify-email/resend` and `/forgot-password` routes using `@fastify/rate-limit`
- [ ] 3.2 Update `apps/api/src/modules/auth/auth.routes.ts` — add `GET /session-info` field `emailVerified` from BetterAuth session user
- [ ] 3.3 Create `apps/api/src/modules/auth/auth.routes.test.ts` (extend) — test: `GET /session-info` includes `emailVerified`, rate-limit returns 429 after 3 req/min
- [ ] 3.4 Update `apps/api/src/shared/plugins/auth.ts` — add `emailVerified` to `request.user` type and extraction from session

## Phase 4: Frontend — Auth Store & API Client

- [x] 4.1 Update `packages/shared/src/types/user.ts` — add `emailVerified?: boolean` to `AuthUser` interface
- [x] 4.2 Update `apps/web/src/shared/stores/authStore.ts` — add `emailVerified` computed, add `verifyEmail(token)` action, add `forgotPassword(email)` action, add `resetPassword(token, newPassword)` action, add `resendVerificationEmail()` action
- [x] 4.3 Update `apps/web/src/shared/stores/authStore.ts` — add `showVerificationBanner` computed based on `isAuthenticated && !emailVerified`

## Phase 5: Frontend — Pages & Routing

- [x] 5.1 Create `apps/web/src/modules/auth/VerifyEmailPage.vue` — handles `/auth/verify-email?token=xxx`, calls `verifyEmail`, shows success/error state, auto-redirects
- [x] 5.2 Create `apps/web/src/modules/auth/ForgotPasswordPage.vue` — email input form, calls `forgotPassword`, shows generic success (no enumeration), link to login
- [x] 5.3 Create `apps/web/src/modules/auth/ResetPasswordPage.vue` — handles `/auth/reset-password?token=xxx`, new password form, calls `resetPassword`, shows success/error
- [x] 5.4 Update `apps/web/src/router/index.ts` — add routes: `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password` (all `requiresAuth: false`)
- [x] 5.5 Create `apps/web/src/shared/components/VerificationBanner.vue` — persistent banner shown when `emailVerified=false`, "Resend" button with cooldown
- [x] 5.6 Update `apps/web/src/shared/layouts/AppLayout.vue` — mount `VerificationBanner` conditionally based on `authStore.showVerificationBanner`

## Phase 6: Integration & Verification

- [ ] 6.1 E2E test scenario: full verification flow — signup → email sent → click link → emailVerified=true (E2E infra not configured — see authStore.email.test.ts for unit tests)
- [ ] 6.2 E2E test scenario: forgot-password flow — request reset → email sent → click link → password reset → new session (E2E infra not configured)
- [ ] 6.3 E2E test scenario: rate limiting — 4 req/min to resend endpoint → 429 on 4th request (backend Phase 2/3 pending)
- [ ] 6.4 E2E test scenario: enumeration prevention — forgot-password with non-existent email → same 200 response (backend Phase 2/3 pending)
- [x] 6.5 Run `pnpm lint && pnpm typecheck && pnpm --filter api vitest run` — all green (pre-existing failures in menus module, unrelated to email-validation change)