/**
 * BetterAuth configuration.
 * Design: AD5 — Anonymous → Free → Pro flow.
 * Spec: REQ-AUTH-01, REQ-AUTH-02
 */

import { betterAuth } from 'better-auth'
import { anonymous } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

  // Anonymous plugin — zero friction entry (REQ-AUTH-01)
  plugins: [
    anonymous({
      // When anonymous user registers, merge their plates
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        // Transfer anonymous user's plates to the new account
        // This is handled in the plates service on registration
        console.info(`Merging anonymous user ${anonymousUser.user.id} into ${newUser.user.id}`)
      },
    }),
  ],

  // Google OAuth (optional for MVP, configurable via env)
  ...(process.env['GOOGLE_CLIENT_ID'] && {
    socialProviders: {
      google: {
        clientId: process.env['GOOGLE_CLIENT_ID'],
        clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      },
    },
  }),

  // Trust proxy headers when behind reverse proxy
  advanced: {
    useSecureCookies: process.env['NODE_ENV'] === 'production',
  },
})

export type Auth = typeof auth
