/**
 * Unit tests for AuthUser type contract.
 *
 * These tests assert that a correctly shaped AuthUser object includes
 * the lastAcceptedDisclaimerVersion field (string | null).
 *
 * Spec: REQ-DC-06, AD-DC-02
 */

import { describe, it, expect } from 'vitest'
import type { AuthUser } from './user.js'

describe('AuthUser', () => {
  it('accepts lastAcceptedDisclaimerVersion as null (new user)', () => {
    const user: AuthUser = {
      id: 'user-1',
      email: 'test@example.com',
      tier: 'PRO',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastAcceptedDisclaimerVersion: null,
    }
    expect(user.lastAcceptedDisclaimerVersion).toBeNull()
  })

  it('accepts lastAcceptedDisclaimerVersion as a version string (accepted user)', () => {
    const user: AuthUser = {
      id: 'user-2',
      email: 'accepted@example.com',
      tier: 'PRO',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastAcceptedDisclaimerVersion: 'v1',
    }
    expect(user.lastAcceptedDisclaimerVersion).toBe('v1')
  })
})
