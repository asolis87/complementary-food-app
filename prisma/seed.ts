/**
 * Prisma seed script — loads Mexican baby food catalog.
 * Run with: pnpm db:seed (from project root)
 *
 * Updated to match Dra. Paulina Trueba Villaseñor (Pediatra Certificada,
 * LASPGHAN, CIENUTRITION) guide — A/L classifications, group assignments,
 * and new foods per the official Protocolo Beikost guide.
 *
 * DISCLAIMER: A/L classifications are based on:
 * - Dra. Paulina Trueba Villaseñor — Protocolo Beikost (primary source)
 * - AAP BRAT diet guidelines
 * - ESPGHAN complementary feeding recommendations (2017)
 * - INCMNSZ (Instituto Nacional de Ciencias Médicas y Nutrición Salvador Zubirán)
 * - Guía de Práctica Clínica IMSS: Alimentación del Lactante
 *
 * Foods marked `needsValidation: true` MUST be reviewed by a pediatric
 * nutritionist (nutrióloga pediátrica) before app launch.
 *
 * Integrity tests: packages/shared/src/data/food-catalog.test.ts + schema-non-destructive.test.ts
 */

import { PrismaClient } from '@prisma/client';
import { foods, type FoodSeed } from '@pakulab/shared';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// ============================================================
// SEED FUNCTION
// ============================================================
async function main() {
  console.log('🌱 Seeding foods...');

  // Distribution summary
  const byCat = foods.reduce(
    (acc, f) => {
      acc[f.group] = (acc[f.group] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const byEffect = foods.reduce(
    (acc, f) => {
      acc[f.alClassification] = (acc[f.alClassification] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log('📦 Foods to seed:', foods.length);
  console.log('📊 By group:', byCat);
  console.log('🔄 By A/L classification:', byEffect);

  const allergenCount = foods.filter((f) => f.isAllergen).length;
  const needsValidationCount = foods.filter((f) => f.needsValidation).length;
  console.log(`⚠️  Allergens: ${allergenCount} | Needs validation: ${needsValidationCount}`);

  let created = 0;
  let updated = 0;

  for (const food of foods) {
    const data = {
      group: food.group,
      alClassification: food.alClassification,
      alScore: food.alScore,
      isAllergen: food.isAllergen,
      allergenType: food.allergenType ?? null,
      ageMonths: food.ageMonths,
      description: food.description ?? null,
      needsValidation: food.needsValidation,
      warningTags: food.warningTags ? [...food.warningTags] : [],
    };

    const existing = await prisma.food.findUnique({ where: { name: food.name } });

    await prisma.food.upsert({
      where: { name: food.name },
      update: data,
      create: { name: food.name, ...data },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`\n✅ Seed complete: ${created} created, ${updated} updated`);

  // Verify final state
  const total = await prisma.food.count();
  const dbByEffect = await prisma.food.groupBy({
    by: ['alClassification'],
    _count: true,
  });
  const dbByGroup = await prisma.food.groupBy({
    by: ['group'],
    _count: true,
  });

  console.log(`\n📈 Database now has ${total} foods`);
  console.log('🔄 By A/L classification:');
  for (const row of dbByEffect) {
    console.log(`   ${row.alClassification}: ${row._count}`);
  }
  console.log('📊 By group:');
  for (const row of dbByGroup) {
    console.log(`   ${row.group}: ${row._count}`);
  }
}

// Entrypoint guard — only run main() when executed directly (not when imported)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
