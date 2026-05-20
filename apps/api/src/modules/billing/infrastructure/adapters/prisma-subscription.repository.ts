/**
 * PrismaSubscriptionRepository — implements SubscriptionRepository port.
 *
 * Adapts PrismaClient operations to the SubscriptionRepository contract.
 * Maps between Prisma row types and domain Subscription entities.
 */

import type { PrismaClient } from '@prisma/client'
import type { Subscription } from '../../domain/entities/subscription.entity.js'
import type {
  SubscriptionRepository,
  CreateSubscriptionData,
} from '../../domain/ports/subscription.repository.js'

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
    })

    return row ? this.toDomain(row) : null
  }

  async findByStripeSubId(stripeSubId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { stripeSubId },
    })

    return row ? this.toDomain(row) : null
  }

  async upsertByUserId(
    userId: string,
    data: CreateSubscriptionData,
  ): Promise<Subscription> {
    const row = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId: data.userId,
        status: data.status,
        interval: data.interval,
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubId: data.stripeSubId ?? null,
        stripePriceId: data.stripePriceId ?? null,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        trialEnd: data.trialEnd ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      },
      update: {
        status: data.status,
        interval: data.interval,
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubId: data.stripeSubId ?? null,
        stripePriceId: data.stripePriceId ?? null,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        trialEnd: data.trialEnd ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        canceledAt: null,
      },
    })

    return this.toDomain(row)
  }

  async updateByStripeSubId(
    stripeSubId: string,
    data: Partial<CreateSubscriptionData>,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.interval !== undefined && { interval: data.interval }),
        ...(data.stripePriceId !== undefined && { stripePriceId: data.stripePriceId }),
        ...(data.currentPeriodEnd !== undefined && { currentPeriodEnd: data.currentPeriodEnd }),
        ...(data.trialEnd !== undefined && { trialEnd: data.trialEnd }),
        ...(data.cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd: data.cancelAtPeriodEnd }),
      },
    })
  }

  // ─── Mapper ────────────────────────────────────────────────────────────

  private toDomain(row: {
    id: string
    userId: string
    status: string
    interval: string
    stripeCustomerId: string | null
    stripeSubId: string | null
    stripePriceId: string | null
    currentPeriodEnd: Date | null
    trialEnd: Date | null
    cancelAtPeriodEnd: boolean
    canceledAt: Date | null
    createdAt: Date
  }): Subscription {
    return {
      id: row.id,
      userId: row.userId,
      status: row.status as Subscription['status'],
      interval: row.interval as Subscription['interval'],
      stripeCustomerId: row.stripeCustomerId,
      stripeSubId: row.stripeSubId,
      stripePriceId: row.stripePriceId,
      currentPeriodEnd: row.currentPeriodEnd,
      trialEnd: row.trialEnd,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      canceledAt: row.canceledAt,
      createdAt: row.createdAt,
    }
  }
}
