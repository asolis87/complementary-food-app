/**
 * Food entity types and enums for the Complementary Food App.
 * These mirror the Prisma schema enums for use on the frontend too.
 */

/** A/L (Astringent/Laxative) classification of a food */
export type ALClassification = 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL'

/** Food group for plate building */
export type FoodGroup = 'FRUIT' | 'VEGETABLE' | 'PROTEIN' | 'CEREAL_TUBER' | 'HEALTHY_FAT'

/** Human-readable Spanish labels for food groups */
export const FOOD_GROUP_LABELS: Record<FoodGroup, string> = {
  FRUIT: 'Frutas',
  VEGETABLE: 'Verduras',
  PROTEIN: 'Proteínas',
  CEREAL_TUBER: 'Cereales y Tubérculos',
  HEALTHY_FAT: 'Grasas Saludables',
}

/** Human-readable Spanish labels for A/L classifications */
export const AL_CLASSIFICATION_LABELS: Record<ALClassification, string> = {
  ASTRINGENT: 'Astringente',
  LAXATIVE: 'Laxante',
  NEUTRAL: 'Neutro',
}

/** Food item as returned by the API */
export interface Food {
  id: string
  name: string
  group: FoodGroup
  alClassification: ALClassification
  alScore: number // -1.0 (astringent) to +1.0 (laxative)
  isAllergen: boolean
  allergenType?: string | null
  ageMonths: number
  description?: string | null
  needsValidation: boolean
  createdAt: string
  updatedAt: string
}

/** Minimal food data needed for plate building and balance calc */
export interface FoodSummary {
  id: string
  name: string
  group: FoodGroup
  alClassification: ALClassification
  ageMonths: number
  isAllergen: boolean
  allergenType?: string | null
}
