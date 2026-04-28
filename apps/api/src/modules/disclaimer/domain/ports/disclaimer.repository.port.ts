/**
 * DisclaimerRepository port — hexagonal interface for disclaimer persistence.
 *
 * Spec: REQ-DC-01 (persist acceptance), REQ-DC-04 (findLatestByUser → null)
 * Design: AD-DC-01 (own module), AD-DC-03 (index-backed findLatest)
 *
 * CONTRACT:
 * - Append-only: only create() and findLatestByUser() are exposed (NF-DC-04).
 * - findLatestByUser returns null when the user has no acceptance history.
 */

export interface DisclaimerAcceptanceRow {
  id: string
  userId: string
  version: string
  acceptedAt: Date
  userAgent: string | null
  ipAddress: string | null
}

export interface CreateDisclaimerInput {
  userId: string
  version: string
  userAgent?: string
  ipAddress?: string
}

/**
 * Repository port — all adapters MUST implement this interface.
 *
 * create: Inserts a new acceptance row. Returns the persisted row.
 * findLatestByUser: Returns the most recent acceptance for the given userId,
 *                   or null when no rows exist (REQ-DC-04).
 */
export interface DisclaimerRepository {
  create(input: CreateDisclaimerInput): Promise<DisclaimerAcceptanceRow>
  findLatestByUser(userId: string): Promise<DisclaimerAcceptanceRow | null>
}
