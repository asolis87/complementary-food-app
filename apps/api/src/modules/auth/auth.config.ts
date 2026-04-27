/**
 * BetterAuth configuration.
 * Design: AD5 — Free → Pro flow (anonymous removed).
 * Spec: REQ-AUTH-01, REQ-AUTH-02, REQ-GOAUTH-01..08
 *
 * Email Verification & Password Reset (AD-EV-01, AD-EV-02):
 * - emailVerification.sendVerificationEmail: sends verification emails on signup/resend
 * - emailAndPassword.sendResetPassword: sends password reset emails
 */

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { PrismaClient } from '@prisma/client'
import { createTrialSubscription } from '../billing/billing.service.js'
import { getAdapter } from '../email/email.service.js'
import {
  verificationEmailHtml,
  verificationEmailText,
  resetPasswordEmailHtml,
  resetPasswordEmailText,
} from '../email/infrastructure/templates/email-templates.js'

const prisma = new PrismaClient()

// In-memory rate limit store for email sending (email verification & password reset)
// Key: email address, Value: timestamp of last send
// Count store: tracks send count within the window
const rateLimitStore = new Map<string, number>()
const rateLimitCount = new Map<string, number>()

// Google OAuth: require BOTH env vars to activate (REQ-GOAUTH-04)
const googleClientId = process.env['GOOGLE_CLIENT_ID']
const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET']
const googleEnabled = !!googleClientId && !!googleClientSecret

if ((googleClientId && !googleClientSecret) || (!googleClientId && googleClientSecret)) {
  console.warn(
    '[auth] Google OAuth: only one of GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET is set. Both are required. Google sign-in is DISABLED.',
  )
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Base URL for auth routes
  baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3001',
  secret: process.env['BETTER_AUTH_SECRET'] ?? 'dev-secret-change-in-production-min-32-chars',

  // Trusted origins for CORS (frontend URLs)
  trustedOrigins: [
    process.env['FRONTEND_URL'] ?? 'http://localhost:5174',
    process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  ],

  // Email + password auth
  emailAndPassword: {
    enabled: true,
    // Send password reset email when user requests it
    sendResetPassword: async ({ user, url }) => {
      // Rate limiting: max 3 password reset emails per email per hour
      const rateLimitKey = `reset:${user.email}`
      const now = Date.now()
      const windowMs = 60 * 60 * 1000 // 1 hour

      const lastSend = rateLimitStore.get(rateLimitKey)
      if (lastSend && now - lastSend < windowMs) {
        const count = rateLimitCount.get(rateLimitKey) ?? 0
        if (count >= 3) {
          console.warn('[auth] rate limit exceeded for password reset', { userId: user.id })
          return // Silently ignore - BetterAuth will return success anyway
        }
        rateLimitCount.set(rateLimitKey, count + 1)
      } else {
        rateLimitStore.set(rateLimitKey, now)
        rateLimitCount.set(rateLimitKey, 1)
      }

      const emailAdapter = getAdapter()
      await emailAdapter.sendEmail({
        to: user.email,
        subject: 'Restablece tu contraseña',
        htmlBody: resetPasswordEmailHtml({ name: user.name ?? user.email.split('@')[0], url }),
        textBody: resetPasswordEmailText({ name: user.name ?? user.email.split('@')[0], url }),
      })
    },
    // Token expires in 1 hour (3600 seconds) - BetterAuth default
    resetPasswordTokenExpiresIn: 3600,
  },

  // Email verification (built into BetterAuth core)
  emailVerification: {
    // Send verification email on signup and resend requests
    sendVerificationEmail: async ({ user, url, token }) => {
      // Rate limiting: max 3 verification emails per email per hour
      const rateLimitKey = `verification:${user.email}`
      const now = Date.now()
      const windowMs = 60 * 60 * 1000 // 1 hour

      const lastSend = rateLimitStore.get(rateLimitKey)
      if (lastSend && now - lastSend < windowMs) {
        const count = rateLimitCount.get(rateLimitKey) ?? 0
        if (count >= 3) {
          console.warn('[auth] rate limit exceeded for verification email', { userId: user.id })
          return // Silently ignore - BetterAuth will return success anyway
        }
        rateLimitCount.set(rateLimitKey, count + 1)
      } else {
        rateLimitStore.set(rateLimitKey, now)
        rateLimitCount.set(rateLimitKey, 1)
      }

      const emailAdapter = getAdapter()

      // Fire and forget - don't await
      void emailAdapter.sendEmail({
        to: user.email,
        subject: 'Verifica tu email',
        htmlBody: verificationEmailHtml({
          name: user.name ?? user.email.split('@')[0],
          url
        }),
        textBody: verificationEmailText({
          name: user.name ?? user.email.split('@')[0],
          url
        }),
      }).catch((err) => {
        console.error('[auth] verification email send failed', err)
      })
    },
    // Auto sign-in after verification
    autoSignInAfterVerification: true,
    // Token expires in 1 hour (3600 seconds)
    expiresIn: 3600,
  },

  // Google OAuth (optional — activated only when both env vars are set)
  ...(googleEnabled && {
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    },
  }),

  // Lifecycle hooks for new user provisioning (REQ-GOAUTH-03)
  databaseHooks: {
    user: {
      create: {
        before: async (user, _ctx) => {
          // Name fallback: prevent NOT NULL violation if Google profile lacks name
          if (!user.name) {
            return {
              data: {
                ...user,
                name: user.email.split('@')[0],
              },
            }
          }
        },
        after: async (user, _ctx) => {
          // Auto-provision 21-day trial for every new user (email or OAuth)
          try {
            await createTrialSubscription(prisma, {
              userId: user.id,
              plan: 'TRIAL',
            })
          } catch (err) {
            // Log but never block — user creation must succeed even if trial fails
            console.error('[auth] Failed to provision trial for user', user.id, err)
          }
        },
      },
    },
  },

  // Trust proxy headers when behind reverse proxy
  advanced: {
    useSecureCookies: process.env['NODE_ENV'] === 'production',
  },
})

export type Auth = typeof auth
