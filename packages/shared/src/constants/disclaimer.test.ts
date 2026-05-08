/**
 * Unit tests for disclaimer version constant.
 *
 * Asserts:
 * - DISCLAIMER_CURRENT_VERSION is a non-empty string
 * - Its current value is 'v1' (the initial version)
 *
 * Spec: REQ-DC-02, AD-DC-02
 */

import { describe, it, expect } from 'vitest'
import { DISCLAIMER_CURRENT_VERSION } from './disclaimer.js'

describe('DISCLAIMER_CURRENT_VERSION', () => {
  it('is a non-empty string', () => {
    expect(typeof DISCLAIMER_CURRENT_VERSION).toBe('string')
    expect(DISCLAIMER_CURRENT_VERSION.length).toBeGreaterThan(0)
  })

  it('is set to v1 as the initial version', () => {
    expect(DISCLAIMER_CURRENT_VERSION).toBe('v1')
  })
})
