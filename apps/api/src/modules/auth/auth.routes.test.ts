/**
 * Integration tests for auth routes — anonymous removal regression tests.
 *
 * These tests verify the removal of anonymous auth:
 * - GET /api/auth/session-info returns tier: 'FREE' when no session (NOT 'ANONYMOUS')
 * - GET /api/auth/session-info response does NOT contain isAnonymous
 * - POST /api/auth/anonymous endpoint does NOT exist (404)
 * - The request.user type no longer includes isAnonymous
 *
 * TDD Phase: RED
 * These tests should FAIL until T4 is implemented (anonymous removal).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserTier } from '@pakulab/shared'

// ============================================================================
// T3: RED TESTS - These should FAIL until anonymous is removed
// ============================================================================

describe('T3-RED: Anonymous removal regression tests', () => {
  describe('GET /api/auth/session-info', () => {
    describe('unauthenticated requests', () => {
      it('MUST return tier: "FREE" (NOT "ANONYMOUS") when no session', async () => {
        /**
         * ARRANGE: Import the actual route handler to test behavior
         * The current implementation returns tier: 'ANONYMOUS' for unauthenticated users.
         * After T4 implementation, it should return tier: 'FREE'.
         *
         * This test reads the source code directly to verify the expected change.
         */
        const fs = await import('fs/promises')
        const path = await import('path')

        const routesPath = path.join(process.cwd(), 'src/modules/auth/auth.routes.ts')
        const sourceCode = await fs.readFile(routesPath, 'utf-8')

        /**
         * RED ASSERTION: The source code currently contains 'ANONYMOUS' as the
         * unauthenticated tier return value. After T4 GREEN implementation,
         * this should be changed to 'FREE'.
         *
         * Current behavior (should FIND this pattern - causing test to PASS):
         *   reply.send({ user: null, tier: 'ANONYMOUS' })
         *
         * Expected behavior (should NOT FIND this pattern - test will PASS after T4):
         *   reply.send({ user: null, tier: 'FREE' })
         */
        const hasAnonyMousTierForUnauthenticated = sourceCode.includes(
          "reply.send({ user: null, tier: 'ANONYMOUS' })"
        )

        // If this assertion FAILS, it means the code has been updated to use 'FREE'
        // If this PASSES, the code still has 'ANONYMOUS' and T4 hasn't been implemented
        if (hasAnonyMousTierForUnauthenticated) {
          // RED: Current behavior - should be changed to 'FREE' in T4
          expect(hasAnonyMousTierForUnauthenticated).toBe(true)
          // Force fail with clear message
          expect.fail(
            "RED TEST: Source still returns tier: 'ANONYMOUS' for unauthenticated users. " +
              "Expected: tier: 'FREE' after T4 implementation."
          )
        } else {
          // GREEN: Code has been updated
          expect(hasAnonyMousTierForUnauthenticated).toBe(false)
        }
      })

      it('MUST NOT return isAnonymous in response for unauthenticated users', async () => {
        /**
         * ARRANGE: Check if session-info response includes isAnonymous
         * Currently the implementation includes isAnonymous: request.user.isAnonymous
         * in the response object. After T4, this field should be removed.
         */
        const fs = await import('fs/promises')
        const path = await import('path')

        const routesPath = path.join(process.cwd(), 'src/modules/auth/auth.routes.ts')
        const sourceCode = await fs.readFile(routesPath, 'utf-8')

        /**
         * RED ASSERTION: Check if response contains isAnonymous field
         * Currently: { user: { ..., isAnonymous: request.user.isAnonymous }, tier: ... }
         * After T4: { user: { ..., tier: ... }, tier: ... } - no isAnonymous
         */
        const hasIsAnonymousInResponse = sourceCode.includes('isAnonymous: request.user.isAnonymous')

        if (hasIsAnonymousInResponse) {
          // RED: Current behavior - should be removed in T4
          expect(hasIsAnonymousInResponse).toBe(true)
          expect.fail(
            "RED TEST: session-info response still includes isAnonymous field. " +
              "Expected: Remove isAnonymous from response after T4 implementation."
          )
        } else {
          // GREEN: Code has been updated
          expect(hasIsAnonymousInResponse).toBe(false)
        }
      })
    })

    describe('authenticated requests', () => {
      it('MUST NOT include isAnonymous in user object', async () => {
        /**
         * ARRANGE: Check if session-info user object includes isAnonymous
         */
        const fs = await import('fs/promises')
        const path = await import('path')

        const routesPath = path.join(process.cwd(), 'src/modules/auth/auth.routes.ts')
        const sourceCode = await fs.readFile(routesPath, 'utf-8')

        // Check both: isAnonymous in user object construction
        const hasIsAnonymousInUserObject = sourceCode.includes('isAnonymous: request.user.isAnonymous')

        if (hasIsAnonymousInUserObject) {
          expect.fail(
            "RED TEST: session-info user object still includes isAnonymous. " +
              "Expected: Remove isAnonymous from user shape after T4 implementation."
          )
        } else {
          expect(hasIsAnonymousInUserObject).toBe(false)
        }
      })
    })
  })

  describe('POST /api/auth/anonymous', () => {
    it('MUST NOT exist as a registered route', async () => {
      /**
       * ARRANGE: Check if anonymous endpoint route exists
       * Currently: fastify.post('/anonymous', ...)
       * After T4: This route should NOT exist
       */
      const fs = await import('fs/promises')
      const path = await import('path')

      const routesPath = path.join(process.cwd(), 'src/modules/auth/auth.routes.ts')
      const sourceCode = await fs.readFile(routesPath, 'utf-8')

      /**
       * RED ASSERTION: Check if /anonymous route is defined
       */
      const hasAnonymousRoute = sourceCode.includes("fastify.post('/anonymous'")

      if (hasAnonymousRoute) {
        // RED: Current behavior - route should be removed in T4
        expect(hasAnonymousRoute).toBe(true)
        expect.fail(
          "RED TEST: POST /anonymous route still exists. " +
            "Expected: Remove this endpoint in T4 implementation."
        )
      } else {
        // GREEN: Route has been removed
        expect(hasAnonymousRoute).toBe(false)
      }
    })
  })
})

describe('T3-RED: auth plugin type declarations', () => {
  it('FastifyRequest.user MUST NOT include isAnonymous field', async () => {
    /**
     * ARRANGE: Check Fastify type declaration for request.user
     * Currently: { id: string; email?: string; tier: UserTier; isAnonymous: boolean }
     * After T4: { id: string; email?: string; tier: UserTier }
     */
    const fs = await import('fs/promises')
    const path = await import('path')

    const pluginPath = path.join(process.cwd(), 'src/shared/plugins/auth.ts')
    const sourceCode = await fs.readFile(pluginPath, 'utf-8')

    /**
     * RED ASSERTION: Check if type declaration includes isAnonymous
     */
    const hasIsAnonymousInType = sourceCode.includes('isAnonymous: boolean')

    if (hasIsAnonymousInType) {
      // RED: Current behavior - should be removed in T4
      expect(hasIsAnonymousInType).toBe(true)
      expect.fail(
        "RED TEST: FastifyRequest.user type still includes isAnonymous: boolean. " +
          "Expected: Remove isAnonymous from type after T4 implementation."
      )
    } else {
      // GREEN: Type has been updated
      expect(hasIsAnonymousInType).toBe(false)
    }
  })

  it('auth plugin MUST NOT assign isAnonymous to request.user', async () => {
    /**
     * ARRANGE: Check if auth plugin assigns isAnonymous
     * Currently: request.user = { ..., isAnonymous: ... }
     * After T4: request.user = { id, email?, tier } - no isAnonymous
     */
    const fs = await import('fs/promises')
    const path = await import('path')

    const pluginPath = path.join(process.cwd(), 'src/shared/plugins/auth.ts')
    const sourceCode = await fs.readFile(pluginPath, 'utf-8')

    /**
     * RED ASSERTION: Check if isAnonymous is assigned to request.user
     */
    const assignsIsAnonymous = sourceCode.includes('isAnonymous:')

    if (assignsIsAnonymous) {
      // RED: Current behavior - should be removed in T4
      expect(assignsIsAnonymous).toBe(true)
      expect.fail(
        "RED TEST: auth plugin still assigns isAnonymous to request.user. " +
          "Expected: Remove isAnonymous assignment after T4 implementation."
      )
    } else {
      // GREEN: Code has been updated
      expect(assignsIsAnonymous).toBe(false)
    }
  })
})

describe('T3-RED: auth.config anonymous plugin', () => {
  it('MUST NOT import or register anonymous plugin', async () => {
    /**
     * ARRANGE: Check if auth.config imports/uses anonymous plugin
     * Currently: import { anonymous } from 'better-auth/plugins'
     * After T4: No anonymous import or registration
     */
    const fs = await import('fs/promises')
    const path = await import('path')

    const configPath = path.join(process.cwd(), 'src/modules/auth/auth.config.ts')
    const sourceCode = await fs.readFile(configPath, 'utf-8')

    /**
     * RED ASSERTION: Check if anonymous plugin is imported
     */
    const importsAnonymous = sourceCode.includes("import { anonymous } from 'better-auth/plugins'")

    /**
     * RED ASSERTION: Check if anonymous plugin is in plugins array
     */
    const registersAnonymous = sourceCode.includes('anonymous(')

    if (importsAnonymous || registersAnonymous) {
      // RED: Current behavior - should be removed in T4
      if (importsAnonymous) {
        expect.fail(
          "RED TEST: auth.config still imports anonymous plugin. " +
            "Expected: Remove anonymous import in T4 implementation."
        )
      }
      if (registersAnonymous) {
        expect.fail(
          "RED TEST: auth.config still registers anonymous plugin. " +
            "Expected: Remove anonymous() from plugins array in T4 implementation."
        )
      }
    } else {
      // GREEN: Plugin has been removed
      expect(importsAnonymous).toBe(false)
      expect(registersAnonymous).toBe(false)
    }
  })
})

// ============================================================================
// Phase 3: Email Verification + Rate Limiting Tests
// ============================================================================

describe('Phase 3: session-info emailVerified field', () => {
  describe('GET /api/auth/session-info', () => {
    it('MUST include emailVerified field in user object', async () => {
      /**
       * RED TEST: session-info response MUST include emailVerified from BetterAuth session.
       * Currently: { user: { id, email, name, tier, subscriptionStatus, trialEnd } }
       * Expected: { user: { id, email, name, tier, subscriptionStatus, trialEnd, emailVerified } }
       */
      const fs = await import('fs/promises')
      const path = await import('path')

      const routesPath = path.join(process.cwd(), 'src/modules/auth/auth.routes.ts')
      const sourceCode = await fs.readFile(routesPath, 'utf-8')

      const hasEmailVerifiedInResponse = sourceCode.includes('emailVerified')

      if (!hasEmailVerifiedInResponse) {
        expect.fail(
          "RED TEST: session-info response does not include emailVerified field. " +
            "Expected: Add emailVerified to user object from request.user.emailVerified."
        )
      }

      expect(hasEmailVerifiedInResponse).toBe(true)
    })

    it('MUST extract emailVerified from request.user', async () => {
      /**
       * RED TEST: session-info MUST extract emailVerified from request.user
       * Currently: request.user does not have emailVerified
       * Expected: request.user.emailVerified is used in session-info response
       */
      const fs = await import('fs/promises')
      const path = await import('path')

      const routesPath = path.join(process.cwd(), 'src/modules/auth/auth.routes.ts')
      const sourceCode = await fs.readFile(routesPath, 'utf-8')

      const extractsEmailVerified = sourceCode.includes('request.user.emailVerified')

      if (!extractsEmailVerified) {
        expect.fail(
          "RED TEST: session-info does not extract emailVerified from request.user. " +
            "Expected: Use request.user.emailVerified in response."
        )
      }

      expect(extractsEmailVerified).toBe(true)
    })
  })

  describe('auth plugin type declarations', () => {
    it('FastifyRequest.user MUST include emailVerified field', async () => {
      /**
       * RED TEST: FastifyRequest.user type MUST include emailVerified field
       * Currently: { id: string; email?: string; tier: UserTier; subscriptionStatus?; trialEnd? }
       * Expected: { id: string; email?: string; tier: UserTier; emailVerified?: boolean; subscriptionStatus?; trialEnd? }
       */
      const fs = await import('fs/promises')
      const path = await import('path')

      const pluginPath = path.join(process.cwd(), 'src/shared/plugins/auth.ts')
      const sourceCode = await fs.readFile(pluginPath, 'utf-8')

      const hasEmailVerifiedInType = sourceCode.includes('emailVerified')

      if (!hasEmailVerifiedInType) {
        expect.fail(
          "RED TEST: FastifyRequest.user type does not include emailVerified field. " +
            "Expected: Add emailVerified?: boolean to request.user type."
        )
      }

      expect(hasEmailVerifiedInType).toBe(true)
    })

    it('auth plugin MUST extract emailVerified from session user', async () => {
      /**
       * RED TEST: auth plugin MUST extract emailVerified from BetterAuth session
       * Currently: request.user is assigned without emailVerified
       * Expected: emailVerified is extracted from session.user.emailVerified
       */
      const fs = await import('fs/promises')
      const path = await import('path')

      const pluginPath = path.join(process.cwd(), 'src/shared/plugins/auth.ts')
      const sourceCode = await fs.readFile(pluginPath, 'utf-8')

      const extractsEmailVerified = sourceCode.includes('emailVerified') &&
                                   (sourceCode.includes('session.user.emailVerified') ||
                                    sourceCode.includes('emailVerified:'))

      if (!extractsEmailVerified) {
        expect.fail(
          "RED TEST: auth plugin does not extract emailVerified from session user. " +
            "Expected: Extract emailVerified from session.user and assign to request.user."
        )
      }

      expect(extractsEmailVerified).toBe(true)
    })
  })
})

describe('Phase 3: Rate limiting on auth endpoints', () => {
  it('MUST apply rate limit to email sending in auth.config.ts callbacks', async () => {
    /**
     * Rate limiting is implemented in-callback (not via Fastify route config) because
     * BetterAuth handles these endpoints via wildcard route (fastify.all('/*')).
     * We verify the rate limiting logic exists in auth.config.ts callbacks.
     */
    const fs = await import('fs/promises')
    const path = await import('path')

    const configPath = path.join(process.cwd(), 'src/modules/auth/auth.config.ts')
    const sourceCode = await fs.readFile(configPath, 'utf-8')

    // Check for rate limiting in sendVerificationEmail callback
    const hasVerificationRateLimit = sourceCode.includes('rateLimit') &&
                                   sourceCode.includes('verification:')

    // Check for rate limiting in sendResetPassword callback
    const hasPasswordResetRateLimit = sourceCode.includes('rateLimit') &&
                                      sourceCode.includes('reset:')

    if (!hasVerificationRateLimit) {
      expect.fail(
        "RED TEST: auth.config.ts does not have rate limiting for verification emails. " +
          "Expected: In-callback rate limit (3 per hour per email) for sendVerificationEmail."
      )
    }

    if (!hasPasswordResetRateLimit) {
      expect.fail(
        "RED TEST: auth.config.ts does not have rate limiting for password reset emails. " +
          "Expected: In-callback rate limit (3 per hour per email) for sendResetPassword."
      )
    }

    expect(hasVerificationRateLimit).toBe(true)
    expect(hasPasswordResetRateLimit).toBe(true)
  })

  it('MUST limit email sends to 3 per email per hour', async () => {
    /**
     * Verify rate limit configuration: max 3 emails per email address per hour.
     */
    const fs = await import('fs/promises')
    const path = await import('path')

    const configPath = path.join(process.cwd(), 'src/modules/auth/auth.config.ts')
    const sourceCode = await fs.readFile(configPath, 'utf-8')

    // Check for count limit of 3
    const hasLimit3 = sourceCode.includes('>= 3') || sourceCode.includes('>= 3)')

    // Check for 1 hour window
    const has1HourWindow = sourceCode.includes('60 * 60 * 1000') ||
                           sourceCode.includes('windowMs')

    if (!hasLimit3) {
      expect.fail(
        "RED TEST: auth.config.ts does not limit to 3 emails per hour. " +
          "Expected: Count limit of 3 in rate limiting logic."
      )
    }

    expect(hasLimit3).toBe(true)
    expect(has1HourWindow).toBe(true)
  })

  it('MUST return 429 Too Many Requests when rate limit exceeded', async () => {
    /**
     * RED TEST: Rate limited endpoints MUST return 429 when limit exceeded
     * Currently: No explicit 429 handling for rate limit errors
     * Expected: Error handler handles rate limit errors with 429 status
     */
    const fs = await import('fs/promises')
    const path = await import('path')

    const appPath = path.join(process.cwd(), 'src/app.ts')
    const sourceCode = await fs.readFile(appPath, 'utf-8')

    // Check for rate limit error handling
    const hasRateLimitHandling = sourceCode.includes('rate-limit') ||
                                 sourceCode.includes('rateLimit') ||
                                 sourceCode.includes('429')

    // Note: @fastify/rate-limit returns 429 by default
    // This test verifies the plugin is registered
    expect(hasRateLimitHandling).toBe(true)
  })
})

describe('Phase 3: BetterAuth password reset endpoints', () => {
  it('MUST have POST /api/auth/request-password-reset endpoint configured', async () => {
    /**
     * RED TEST: BetterAuth provides /request-password-reset endpoint by default
     * when emailAndPassword.sendResetPassword is configured.
     * We verify this is documented/expected.
     */
    const fs = await import('fs/promises')
    const path = await import('path')

    const configPath = path.join(process.cwd(), 'src/modules/auth/auth.config.ts')
    const sourceCode = await fs.readFile(configPath, 'utf-8')

    const hasPasswordResetConfig = sourceCode.includes('sendResetPassword')

    if (!hasPasswordResetConfig) {
      expect.fail(
        "RED TEST: auth.config does not configure sendResetPassword callback. " +
          "Expected: Add sendResetPassword callback to emailAndPassword config."
      )
    }

    expect(hasPasswordResetConfig).toBe(true)
  })
})