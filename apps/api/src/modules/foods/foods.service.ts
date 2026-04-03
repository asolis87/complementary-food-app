/**
 * Food service — business logic for the food catalog.
 * Spec: REQ-FD-01, REQ-FD-02
 * 
 * Search implementation uses PostgreSQL unaccent() extension for 
 * accent-insensitive search (e.g., "platano" matches "plátano").
 */

import { FOOD_GROUP_LABELS } from '@pakulab/shared'
import type { PrismaClient, Food } from '@prisma/client'
import type { ListFoodsQuery } from './foods.schema.js'

/**
 * Normalize search term by removing accents and converting to lowercase.
 * This matches the PostgreSQL unaccent(LOWER()) behavior.
 */
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export async function listFoods(prisma: PrismaClient, query: ListFoodsQuery) {
  const { q, group, alClassification, ageMonths, isAllergen, allergenFree, page, limit } = query

  // Build WHERE conditions
  const whereConditions: string[] = []
  const params: (string | number | boolean | string[])[] = []
  let paramIndex = 1

  // Text search using unaccent for accent-insensitive matching
  if (q) {
    whereConditions.push(`unaccent(LOWER(name)) LIKE unaccent(LOWER($${paramIndex}))`)
    params.push(`%${q}%`)
    paramIndex++
  }

  // Food group filter — cast to text because PostgreSQL can't compare enum with plain text
  if (group) {
    whereConditions.push(`"group"::text = $${paramIndex}`)
    params.push(group)
    paramIndex++
  }

  // A/L classification filter — same cast needed for ALClassification enum
  if (alClassification) {
    whereConditions.push(`"alClassification"::text = $${paramIndex}`)
    params.push(alClassification)
    paramIndex++
  }

  // Age filter — only foods suitable for this age or younger
  if (ageMonths !== undefined) {
    whereConditions.push(`"ageMonths" <= $${paramIndex}`)
    params.push(ageMonths)
    paramIndex++
  }

  // Allergen boolean filter
  if (isAllergen !== undefined) {
    whereConditions.push(`"isAllergen" = $${paramIndex}`)
    params.push(isAllergen)
    paramIndex++
  }

  // Exclude allergens — foods that are allergens of the specified type
  if (allergenFree) {
    const allergenTypes = allergenFree.split(',').map((a) => a.trim())
    whereConditions.push(`("allergenType" IS NULL OR "allergenType" NOT IN ($${paramIndex}))`)
    params.push(allergenTypes)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : ''

  const skip = (page - 1) * limit

  // Use raw query with unaccent for accent-insensitive search
  const foodsQuery = `
    SELECT * FROM "Food"
    ${whereClause}
    ORDER BY name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  params.push(limit, skip)

  const countQuery = `
    SELECT COUNT(*)::int as count FROM "Food"
    ${whereClause}
  `
  // For count, we need only the filter params (without limit/offset)
  const countParams = params.slice(0, paramIndex - 1)

  const [foods, countResult] = await prisma.$transaction([
    prisma.$queryRawUnsafe<Food[]>(foodsQuery, ...params),
    prisma.$queryRawUnsafe<{ count: number }[]>(countQuery, ...countParams),
  ])

  return {
    data: foods,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  }
}

export async function getFoodById(prisma: PrismaClient, id: string) {
  return prisma.food.findUnique({ where: { id } })
}

/**
 * Quick search — top 10 foods by name similarity.
 * Used for autocomplete in the plate builder.
 * Uses unaccent() for accent-insensitive search.
 */
export async function searchFoods(prisma: PrismaClient, query: string) {
  const searchQuery = `
    SELECT 
      id,
      name,
      "group",
      "alClassification",
      "ageMonths",
      "isAllergen",
      "allergenType"
    FROM "Food"
    WHERE unaccent(LOWER(name)) LIKE unaccent(LOWER($1))
    ORDER BY name ASC
    LIMIT 10
  `

  return prisma.$queryRawUnsafe<
    Pick<Food, 'id' | 'name' | 'group' | 'alClassification' | 'ageMonths' | 'isAllergen' | 'allergenType'>[]
  >(searchQuery, `%${query}%`)
}

/**
 * Returns available food groups with Spanish labels from shared constants.
 */
export function getFoodGroups() {
  const groups = Object.entries(FOOD_GROUP_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
  return { groups }
}
