/**
 * PrismaUserAccountAdapter — implements UserAccountPort for GDPR data wipe.
 *
 * Extracted from billing.service.ts lines 363-460.
 * Uses Prisma $transaction for atomic deletion of all user data.
 * Delete order respects FK constraints (children before parents).
 */

import type { PrismaClient } from '@prisma/client'
import type { UserAccountPort } from '../../domain/ports/user-account.port.js'

export class PrismaUserAccountAdapter implements UserAccountPort {
  constructor(private readonly prisma: PrismaClient) {}

  async deleteUserAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Get all baby profile IDs for this user (needed for cascading deletes)
      const babyProfiles = await tx.babyProfile.findMany({
        where: { userId },
        select: { id: true },
      })
      const babyProfileIds = babyProfiles.map((bp) => bp.id)

      // Delete PlateItems first (cascade from Plate)
      await tx.plateItem.deleteMany({
        where: {
          plate: { userId },
        },
      })

      // Delete Plates (SetNull on user relation, so must delete explicitly)
      await tx.plate.deleteMany({
        where: { userId },
      })

      // Delete FoodLogs (cascade from BabyProfile)
      if (babyProfileIds.length > 0) {
        await tx.foodLog.deleteMany({
          where: { babyProfileId: { in: babyProfileIds } },
        })
      }

      // Delete MenuMeals (cascade from WeeklyMenu → MenuDay)
      await tx.menuMeal.deleteMany({
        where: {
          menuDay: {
            menu: { userId },
          },
        },
      })

      // Delete MenuDays (cascade from WeeklyMenu)
      await tx.menuDay.deleteMany({
        where: {
          menu: { userId },
        },
      })

      // Delete WeeklyMenus (cascade from BabyProfile)
      if (babyProfileIds.length > 0) {
        await tx.weeklyMenu.deleteMany({
          where: { babyProfileId: { in: babyProfileIds } },
        })
      }

      // Delete BabyProfiles (cascade from User)
      await tx.babyProfile.deleteMany({
        where: { userId },
      })

      // Delete Subscription (cascade from User)
      await tx.subscription.deleteMany({
        where: { userId },
      })

      // Delete Sessions (cascade from User)
      await tx.session.deleteMany({
        where: { userId },
      })

      // Delete Accounts (cascade from User)
      await tx.account.deleteMany({
        where: { userId },
      })

      // Finally, delete the User
      await tx.user.delete({
        where: { id: userId },
      })
    })
  }
}
