/**
 * PrismaDisclaimerRepository — Prisma adapter for DisclaimerRepository port.
 *
 * Spec: REQ-DC-01 (persist acceptance), REQ-DC-04 (null when no history)
 * Design: AD-DC-01 (hexagonal adapter), AD-DC-03 (index seek via take:1 + orderBy desc)
 *
 * findLatestByUser MUST use `take: 1, orderBy: { acceptedAt: 'desc' }` to leverage
 * the @@index([userId, acceptedAt(sort: Desc)]) composite index (AD-DC-03).
 *
 * This adapter is append-only — only create() and findLatestByUser() are exposed (NF-DC-04).
 */

import type { PrismaClient } from '@prisma/client'
import type {
  CreateDisclaimerInput,
  DisclaimerAcceptanceRow,
  DisclaimerRepository,
} from '../../domain/ports/disclaimer.repository.port.js'

export class PrismaDisclaimerRepository implements DisclaimerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateDisclaimerInput): Promise<DisclaimerAcceptanceRow> {
    return this.prisma.disclaimerAcceptance.create({
      data: {
        userId: input.userId,
        version: input.version,
        ...(input.userAgent !== undefined && { userAgent: input.userAgent }),
        ...(input.ipAddress !== undefined && { ipAddress: input.ipAddress }),
      },
    })
  }

  async findLatestByUser(userId: string): Promise<DisclaimerAcceptanceRow | null> {
    return this.prisma.disclaimerAcceptance.findFirst({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
      take: 1,
    })
  }
}
