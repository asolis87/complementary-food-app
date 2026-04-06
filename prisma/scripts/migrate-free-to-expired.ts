/**
 * Migration script: Create EXPIRED subscriptions for existing FREE users.
 * 
 * Trial-first model (AD7): Existing users without a subscription need an EXPIRED
 * subscription record so the lockout logic works correctly. Without this, they
 * would resolve to FREE tier but never see the paywall.
 * 
 * Run with: npx tsx prisma/scripts/migrate-free-to-expired.ts
 * 
 * Idempotent: Safe to run multiple times — skips users who already have a subscription.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding users without subscriptions...')
  
  // Find all users who don't have a subscription record
  const usersWithoutSubscription = await prisma.user.findMany({
    where: {
      subscription: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })
  
  console.log(`📊 Found ${usersWithoutSubscription.length} users without subscription`)
  
  if (usersWithoutSubscription.length === 0) {
    console.log('✅ No migration needed — all users have subscriptions')
    return
  }
  
  // Create EXPIRED subscription for each user
  console.log('📝 Creating EXPIRED subscriptions...')
  
  let migrated = 0
  let skipped = 0
  
  for (const user of usersWithoutSubscription) {
    try {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: 'EXPIRED',
          interval: 'MONTHLY',
          trialEnd: new Date(), // Expired immediately
          currentPeriodEnd: new Date(),
          stripeCustomerId: null,
          stripeSubId: null,
          stripePriceId: null,
          cancelAtPeriodEnd: false,
        },
      })
      migrated++
      console.log(`   ✓ ${user.email ?? user.id}`)
    } catch (error) {
      // Skip if subscription already exists (race condition / previous run)
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        skipped++
        console.log(`   ⏭ ${user.email ?? user.id} (already has subscription)`)
      } else {
        throw error
      }
    }
  }
  
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Migration complete`)
  console.log(`   Migrated: ${migrated} users`)
  if (skipped > 0) {
    console.log(`   Skipped:  ${skipped} users (already had subscription)`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(async (error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })