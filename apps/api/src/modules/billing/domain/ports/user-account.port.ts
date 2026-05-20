/**
 * UserAccountPort — hexagonal outbound port for GDPR account deletion.
 *
 * This is a cross-cutting port that lives in the billing module because
 * it was originally bundled in billing.service.ts. It may be extracted
 * to its own module in a future refactor.
 */

export interface UserAccountPort {
  deleteUserAccount(userId: string): Promise<void>
}
