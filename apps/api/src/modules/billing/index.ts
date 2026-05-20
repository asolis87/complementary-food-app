/**
 * Billing module barrel — backward-compatible exports.
 *
 * Provides the same function signatures that auth.config.ts and profiles.routes.ts expect:
 *   createTrialSubscription(prisma, { userId, plan })
 *   deleteUserAccount(prisma, userId)
 *
 * These wrap the new hexagonal use cases, accepting PrismaClient as first argument
 * to match the old flat-function API. Once all consumers migrate to DI, these
 * wrappers can be removed.
 */

import type { PrismaClient } from '@prisma/client'
import { PrismaSubscriptionRepository } from './infrastructure/adapters/prisma-subscription.repository.js'
import { PrismaUserAccountAdapter } from './infrastructure/adapters/prisma-user-account.adapter.js'
import { StartTrialUseCase } from './application/use-cases/start-trial.use-case.js'
import { DeleteUserAccountUseCase } from './application/use-cases/delete-user-account.use-case.js'
import type { TrialPlan } from './application/dtos/trial.dto.js'

export async function createTrialSubscription(
  prisma: PrismaClient,
  input: { userId: string; plan: TrialPlan },
) {
  const repo = new PrismaSubscriptionRepository(prisma)
  const useCase = new StartTrialUseCase(repo)
  return useCase.execute(input)
}

export async function deleteUserAccount(prisma: PrismaClient, userId: string): Promise<void> {
  const adapter = new PrismaUserAccountAdapter(prisma)
  const useCase = new DeleteUserAccountUseCase(adapter)
  return useCase.execute(userId)
}
