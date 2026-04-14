/**
 * BetterAuth configuration.
 * Design: AD5 — Free → Pro flow (anonymous removed).
 * Spec: REQ-AUTH-01, REQ-AUTH-02, REQ-GOAUTH-01..08
 */

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { PrismaClient } from '@prisma/client'
import { createTrialSubscription } from '../billing/billing.service.js'

const prisma = new PrismaClient()

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
