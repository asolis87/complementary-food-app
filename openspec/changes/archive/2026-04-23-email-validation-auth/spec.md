# Email Verification + Forgot Password — Delta Spec

**Change**: email-validation-auth
**Status**: specs complete
**Date**: 2026-04-23

---

## ADDED Requirements

### REQ-EV-01: Email Verification Flow

The system MUST send a verification email after registration and verify the token on click, setting `emailVerified = true`.

#### Scenario: Verification email sent after signup

- GIVEN a new user registers via email/password
- WHEN the registration completes successfully
- THEN the system MUST send a verification email to the registered address
- AND the email MUST contain a time-limited token (expires in 1h)
- AND `User.emailVerified` MUST remain `false` until the token is verified

#### Scenario: Successful email verification

- GIVEN the user receives a verification email
- WHEN the user clicks the verification link
- THEN the system MUST set `User.emailVerified = true`
- AND MUST invalidate the token (single-use)
- AND MUST redirect to the frontend with a success indicator

#### Scenario: Expired verification token

- GIVEN the user clicks a verification link that is >1h old
- WHEN the verification endpoint processes the request
- THEN the system MUST reject with a clear error message
- AND MUST NOT set `emailVerified = true`

#### Scenario: Reused verification token

- GIVEN the user clicks a verification link that was already used
- WHEN the verification endpoint processes the request
- THEN the system MUST reject with a clear error message

---

### REQ-EV-02: Resend Verification Email

The system MUST allow resending a verification email with a 60-second cooldown per user.

#### Scenario: Resend within cooldown

- GIVEN an unverified user requests a resend
- WHEN less than 60 seconds have passed since the last send
- THEN the system MUST reject with HTTP 429 and a `Retry-After` header
- AND MUST NOT send a duplicate email

#### Scenario: Resend after cooldown

- GIVEN an unverified user requests a resend
- WHEN 60+ seconds have passed since the last send
- THEN the system MUST generate a new token and send a new email
- AND MUST invalidate any previous pending tokens for that user

---

### REQ-EV-03: Login Behavior with Unverified Email

The system MUST allow login with an unverified email but MUST display a persistent verification banner in the UI.

#### Scenario: Unverified user signs in

- GIVEN a user with `emailVerified = false` signs in
- WHEN the session is established
- THEN the system MUST NOT block authentication
- AND `GET /api/auth/session-info` MUST include `emailVerified: false`
- AND the frontend MUST display a persistent banner prompting email verification

#### Scenario: Verified user signs in

- GIVEN a user with `emailVerified = true` signs in
- WHEN the session is established
- THEN the system MUST NOT display the verification banner

---

### REQ-FP-01: Forgot Password Request

The system MUST send a password-reset email when a user requests it, regardless of whether the email exists (enumeration prevention).

#### Scenario: Existing email requests reset

- GIVEN a user submits an email to the forgot-password endpoint
- WHEN the email exists in the system
- THEN the system MUST send a reset link with a time-limited token (expires in 1h) to that address
- AND MUST return a generic success response (HTTP 200)

#### Scenario: Non-existent email requests reset (enumeration prevention)

- GIVEN a user submits an email to the forgot-password endpoint
- WHEN the email does NOT exist in the system
- THEN the system MUST return the SAME generic success response (HTTP 200)
- AND MUST NOT reveal whether the email is registered
- AND MUST NOT send any email

---

### REQ-FP-02: Password Reset Execution

The system MUST allow password reset with a valid token and invalidate the token immediately after use.

#### Scenario: Successful password reset

- GIVEN the user clicks a valid reset link and submits a new password
- WHEN the reset endpoint processes the request with a valid token
- THEN the system MUST update the password
- AND MUST invalidate the reset token (single-use)
- AND MUST invalidate all existing sessions for that user
- AND MUST return success

#### Scenario: Expired reset token

- GIVEN the user submits a reset with an expired token (>1h)
- WHEN the reset endpoint processes the request
- THEN the system MUST reject with a clear error

#### Scenario: Reused reset token

- GIVEN the user submits a reset with a previously-used token
- WHEN the reset endpoint processes the request
- THEN the system MUST reject with a clear error

---

### REQ-FP-03: Rate Limiting on Auth Endpoints

The system MUST rate-limit verification-resend and forgot-password endpoints at 3 requests per minute per IP.

#### Scenario: Rate limit exceeded

- GIVEN an IP address exceeds 3 requests/minute to `/api/auth/verify-email/resend` or `/api/auth/forgot-password`
- WHEN the 4th request arrives within 60 seconds
- THEN the system MUST return HTTP 429 with a `Retry-After` header

#### Scenario: Rate limit not exceeded

- GIVEN an IP address has made 2 or fewer requests in the last 60 seconds
- WHEN a new request arrives
- THEN the system MUST process the request normally

---

### REQ-ED-01: Hexagonal Email Module

The system MUST implement email sending via a hexagonal port/adapter pattern with async delivery.

#### Scenario: Email sent via ResendAdapter (production)

- GIVEN the system needs to send an email
- WHEN the email port `sendEmail()` is called
- THEN the call MUST be async (non-blocking) — the caller MUST NOT wait for delivery confirmation
- AND the `EmailPort` interface MUST define: `sendEmail(to: string, subject: string, htmlBody: string, textBody?: string): Promise<void>`
- AND the `ResendAdapter` MUST implement `EmailPort` using the Resend API

#### Scenario: Email sent via ConsoleLogAdapter (development)

- GIVEN the system is in development mode
- WHEN the `ConsoleLogAdapter` is used
- THEN it MUST log the email details to console without sending
- AND it MUST resolve immediately (no network calls)

#### Scenario: Email delivery failure

- GIVEN the ResendAdapter fails to deliver an email
- WHEN the adapter catches a delivery error
- THEN the system MUST log the error but MUST NOT fail the originating request (registration, resend, forgot-password)