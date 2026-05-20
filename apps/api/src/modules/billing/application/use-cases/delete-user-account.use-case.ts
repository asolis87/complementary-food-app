/**
 * DeleteUserAccountUseCase — completely deletes a user account and all data.
 *
 * Spec: REQ-BH-06
 * Design: AD6 — GDPR-compliant data wipe.
 *
 * Extracted from billing.service.ts lines 363-460.
 * This use case orchestrates the deletion via the UserAccountPort.
 * The adapter (PrismaUserAccountAdapter) handles the Prisma transaction.
 */

import type { UserAccountPort } from '../../domain/ports/user-account.port.js'

export class DeleteUserAccountUseCase {
  constructor(private readonly userAccountPort: UserAccountPort) {}

  async execute(userId: string): Promise<void> {
    await this.userAccountPort.deleteUserAccount(userId)
  }
}
