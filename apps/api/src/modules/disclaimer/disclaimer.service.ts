/**
 * DisclaimerService — acceptDisclaimer use case.
 *
 * Spec: REQ-DC-01 (persist acceptance), REQ-DC-02 (version validation)
 * Design: AD-DC-04 (always-insert; version mismatch → 400 BadRequest)
 *
 * Depends on DisclaimerRepository port — no direct Prisma coupling.
 */

import { ValidationError } from '../../shared/errors/index.js'
import { DISCLAIMER_CURRENT_VERSION } from './disclaimer.constants.js'
import type { DisclaimerRepository, DisclaimerAcceptanceRow } from './domain/ports/disclaimer.repository.port.js'

// ─── Input / Output ───────────────────────────────────────────────────────────

export interface AcceptDisclaimerInput {
  userId: string
  version: string
  userAgent?: string
  ipAddress?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class DisclaimerService {
  constructor(private readonly repo: DisclaimerRepository) {}

  /**
   * Validates that `version === DISCLAIMER_CURRENT_VERSION` then inserts a new
   * acceptance row (always-insert — append-only per AD-DC-04).
   *
   * @throws ValidationError (400) when version does not match the constant.
   */
  async acceptDisclaimer(input: AcceptDisclaimerInput): Promise<DisclaimerAcceptanceRow> {
    const { userId, version, userAgent, ipAddress } = input

    if (version !== DISCLAIMER_CURRENT_VERSION) {
      throw new ValidationError(
        `Versión de descargo de responsabilidad inválida: "${version}". Versión actual: "${DISCLAIMER_CURRENT_VERSION}".`,
      )
    }

    return this.repo.create({
      userId,
      version,
      ...(userAgent !== undefined && { userAgent }),
      ...(ipAddress !== undefined && { ipAddress }),
    })
  }
}
