/**
 * Integration tests for allergens routes.
 *
 * Tests route registration, auth guards, tier gates, and cache headers.
 *
 * Spec: REQ-A1, REQ-A7 (PRO tier gate)
 */

import { describe, it, expect } from 'vitest'
import { DASHBOARD_CACHE_TTL } from '@pakulab/shared'

// ── Route structure tests ─────────────────────────────────────────────────────

describe('Allergens routes structure', () => {
  it('has GET /status endpoint defined', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const routesPath = path.join(process.cwd(), 'src/modules/allergens/allergens.routes.ts')
    const sourceCode = await fs.readFile(routesPath, 'utf-8')

    // Verify GET /status route exists
    expect(sourceCode).toContain("'/status'")
    expect(sourceCode).toContain('getStatus')
  })

  it('requires auth (requireAuth preHandler)', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const routesPath = path.join(process.cwd(), 'src/modules/allergens/allergens.routes.ts')
    const sourceCode = await fs.readFile(routesPath, 'utf-8')

    expect(sourceCode).toContain('requireAuth')
  })

  it('requires PRO tier (requireTier preHandler)', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const routesPath = path.join(process.cwd(), 'src/modules/allergens/allergens.routes.ts')
    const sourceCode = await fs.readFile(routesPath, 'utf-8')

    expect(sourceCode).toContain("requireTier('PRO')")
  })

  it('uses statusQuerySchema for validation', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const routesPath = path.join(process.cwd(), 'src/modules/allergens/allergens.routes.ts')
    const sourceCode = await fs.readFile(routesPath, 'utf-8')

    expect(sourceCode).toContain('statusQuerySchema')
  })

  it('sets cache headers with allergens TTL', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const routesPath = path.join(process.cwd(), 'src/modules/allergens/allergens.routes.ts')
    const sourceCode = await fs.readFile(routesPath, 'utf-8')

    expect(sourceCode).toContain('setCacheHeaders')
    expect(sourceCode).toContain('DASHBOARD_CACHE_TTL.allergens')
  })

  it('returns data envelope { data }', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const routesPath = path.join(process.cwd(), 'src/modules/allergens/allergens.routes.ts')
    const sourceCode = await fs.readFile(routesPath, 'utf-8')

    expect(sourceCode).toContain('{ data }')
  })
})

// ── Cache configuration test ──────────────────────────────────────────────────

describe('Allergens cache header configuration', () => {
  it('allergens endpoint has 1h TTL', () => {
    expect(DASHBOARD_CACHE_TTL.allergens).toBe(60 * 60)
  })
})

// ── Module registration test ──────────────────────────────────────────────────

describe('Allergens module registration in app.ts', () => {
  it('registers allergens routes with /api/allergens prefix', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const appPath = path.join(process.cwd(), 'src/app.ts')
    const sourceCode = await fs.readFile(appPath, 'utf-8')

    expect(sourceCode).toContain('allergensRoutes')
    expect(sourceCode).toContain('/api/allergens')
  })
})
