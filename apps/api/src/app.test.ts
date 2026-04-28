import { describe, expect, it } from 'vitest'
import { parseTrustProxy } from './app.js'

describe('parseTrustProxy (audit M-04)', () => {
  it('returns false when env var is undefined', () => {
    expect(parseTrustProxy(undefined)).toBe(false)
  })

  it('returns false for "false"', () => {
    expect(parseTrustProxy('false')).toBe(false)
  })

  it('returns true for "true"', () => {
    expect(parseTrustProxy('true')).toBe(true)
  })

  it('parses positive integers as hop count', () => {
    expect(parseTrustProxy('1')).toBe(1)
    expect(parseTrustProxy('3')).toBe(3)
  })

  it('passes through CIDR or IP lists as string', () => {
    expect(parseTrustProxy('127.0.0.1')).toBe('127.0.0.1')
    expect(parseTrustProxy('10.0.0.0/8,192.168.1.1')).toBe('10.0.0.0/8,192.168.1.1')
    expect(parseTrustProxy('loopback')).toBe('loopback')
  })

  it('does not accept zero or negative as hop count', () => {
    expect(parseTrustProxy('0')).toBe('0')
    expect(parseTrustProxy('-1')).toBe('-1')
  })
})
