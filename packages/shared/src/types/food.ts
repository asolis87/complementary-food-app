/**
 * Food entity types and enums for Pakulab.
 * These mirror the Prisma schema enums for use on the frontend too.
 */

/** A/L (Astringent/Laxative) classification of a food */
export type ALClassification = 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL'

/** Food group for plate building */
export type FoodGroup = 'FRUIT' | 'VEGETABLE' | 'PROTEIN' | 'CEREAL_TUBER' | 'HEALTHY_FAT'

/** Warning tags for food safety (choking, age restrictions, etc.) */
export const WARNING_TAGS = [
  'PROHIBITED_UNDER_24M',
  'CHOKING_HAZARD_UNDER_5Y',
  'PROHIBITED_PEDIATRIC',
  'REQUIRES_PREPARATION',
] as const

export type WarningTag = (typeof WARNING_TAGS)[number]

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

/** Human-readable Spanish (es-MX tuteo) labels for warning tags */
export const WARNING_TAG_LABELS: Record<WarningTag, string> = {
  PROHIBITED_UNDER_24M: 'No recomendado antes de los 2 años',
  CHOKING_HAZARD_UNDER_5Y: 'Riesgo de atragantamiento en menores de 5 años',
  PROHIBITED_PEDIATRIC: 'No recomendado en toda la edad pediátrica',
  REQUIRES_PREPARATION: 'Requiere preparación específica (cocción/corte)',
}

/** Canonical pediatric safety disclaimer shown alongside warning tags (es-MX tuteo) */
export const WARNING_DISCLAIMER = 'Si tienes dudas, consulta a tu pediatra.'

/** Food item as returned by the API */
export interface Food {
  id: string
  name: string
  group: FoodGroup
  alClassification: ALClassification
  alScore: number // -1.0 (astringent) to +1.0 (laxative)
  isAllergen: boolean
  allergenType?: string | null
  isIronRich: boolean
  ageMonths: number
  description?: string | null
  needsValidation: boolean
  warningTags: readonly WarningTag[]
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
  isIronRich: boolean
  warningTags: readonly WarningTag[]
}
