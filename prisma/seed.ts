/**
 * Prisma seed script — loads Mexican baby food catalog.
 * Run with: pnpm db:seed (from project root)
 *
 * T-008 + T-009: Food data curation — 102 foods spanning all 5 groups.
 *
 * DISCLAIMER: A/L classifications are based on published evidence:
 * - AAP BRAT diet guidelines
 * - ESPGHAN complementary feeding recommendations (2017)
 * - INCMNSZ (Instituto Nacional de Ciencias Médicas y Nutrición Salvador Zubirán)
 * - Guía de Práctica Clínica IMSS: Alimentación del Lactante
 *
 * Foods marked `needsValidation: true` MUST be reviewed by a pediatric
 * nutritionist (nutrióloga pediátrica) before app launch.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FoodSeed {
  name: string;
  group: 'FRUIT' | 'VEGETABLE' | 'PROTEIN' | 'CEREAL_TUBER' | 'HEALTHY_FAT';
  alClassification: 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL';
  alScore: number; // -1.0 (most astringent) to +1.0 (most laxative)
  isAllergen: boolean;
  allergenType?: string;
  ageMonths: number; // minimum recommended age in months
  description?: string;
  needsValidation: boolean; // true = A/L score needs nutriólogo confirmation
}

// ============================================================
// FRUTAS (26 foods)
// ============================================================
const fruits: FoodSeed[] = [
  {
    name: 'Plátano maduro',
    group: 'FRUIT',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Ofrecer maduro (manchas marrones), en trozos blandos o puré. El plátano MUY maduro pierde su efecto astringente — el almidón se convierte en azúcar. Ideal primer alimento.',
    needsValidation: false,
  },
  {
    name: 'Plátano macho cocido',
    group: 'FRUIT',
    alClassification: 'ASTRINGENT',
    alScore: -0.8,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Más astringente que el plátano Tabasco por su alto contenido de almidón resistente y taninos. Cocer bien hasta ablandar. Útil para diarrea leve.',
    needsValidation: false,
  },
  {
    name: 'Manzana cocida (sin cáscara)',
    group: 'FRUIT',
    alClassification: 'ASTRINGENT',
    alScore: -0.5,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Cocer hasta ablandar. La pectina cocida forma un gel de efecto astringente. Excelente para diarrea leve. Pelar antes de cocer para bebés menores de 9 meses.',
    needsValidation: false,
  },
  {
    name: 'Manzana cruda (con cáscara)',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 12,
    description:
      'La cáscara contiene pectina insoluble y sorbitol con efecto laxante. Ofrecer rallada o en trozos muy pequeños solo después de los 12 meses — riesgo de asfixia.',
    needsValidation: false,
  },
  {
    name: 'Pera cocida',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.8,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Rica en fibra soluble y sorbitol — efecto laxante notable y bien documentado. Excelente para estreñimiento. Cocer hasta suave para bebés menores de 9 meses.',
    needsValidation: false,
  },
  {
    name: 'Papaya',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.8,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Contiene papaína, enzima digestiva que facilita el tránsito intestinal. Efecto laxante bien documentado. Rica en vitamina C y betacaroteno. Ofrecer madura y en puré.',
    needsValidation: false,
  },
  {
    name: 'Mango',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Fruta tropical rica en fibra y vitamina A. Efecto laxante moderado. Ofrecer maduro en puré o en tiras BLW. Puede causar irritación alrededor de la boca en algunos bebés.',
    needsValidation: false,
  },
  {
    name: 'Durazno',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.6,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Rico en sorbitol y fibra soluble — efecto laxante suave a moderado. Retirar hueso y piel (hasta 9 meses). Ofrecer maduro; verde contiene más taninos.',
    needsValidation: false,
  },
  {
    name: 'Chabacano (albaricoque)',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.6,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Rico en betacaroteno y sorbitol. Efecto laxante suave. Retirar hueso. Cocer si no está muy maduro. Excelente fuente de vitamina A.',
    needsValidation: false,
  },
  {
    name: 'Ciruela fresca',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.7,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Rica en sorbitol — efecto laxante notable. Retirar hueso. Cocer para bebés menores de 8 meses. Usar con moderación para no provocar diarrea.',
    needsValidation: false,
  },
  {
    name: 'Ciruela pasa',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.9,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Máxima concentración de sorbitol y fibra. El laxante natural más potente en la dieta del bebé. Usar con mucha moderación — pocas piezas o una cucharada de puré es suficiente.',
    needsValidation: false,
  },
  {
    name: 'Kiwi',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.7,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Contiene actinidina (enzima) y fibra insoluble con efecto laxante marcado. Puede causar reacción oral en algunos bebés. Introducir gradualmente después de 8 meses.',
    needsValidation: true,
  },
  {
    name: 'Fresa',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Lavar muy bien. Puede causar reacción histamínica (enrojecimiento de piel alrededor de boca — no es alergia). Efecto laxante suave. Machacar hasta los 12 meses.',
    needsValidation: false,
  },
  {
    name: 'Sandía',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.2,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Alto contenido de agua — facilita el tránsito intestinal. Efecto laxante suave. Retirar semillas negras. Excelente para hidratación en clima caluroso.',
    needsValidation: false,
  },
  {
    name: 'Melón',
    group: 'FRUIT',
    alClassification: 'NEUTRAL',
    alScore: 0.1,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Alto contenido de agua. Textura suave ideal para bebés. Efecto prácticamente neutro en tránsito. Rico en vitamina A y C. Fácil de hacer puré.',
    needsValidation: false,
  },
  {
    name: 'Guayaba cocida',
    group: 'FRUIT',
    alClassification: 'ASTRINGENT',
    alScore: -0.4,
    isAllergen: false,
    ageMonths: 8,
    description:
      'La cáscara contiene taninos astringentes. Cocer y colar para eliminar semillas duras. Rica en vitamina C (más que la naranja). Efecto astringente moderado.',
    needsValidation: true,
  },
  {
    name: 'Mandarina',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Cítrico — puede causar irritación perioral antes de 8 meses. Rica en vitamina C. Retirar membranas blancas. Efecto laxante suave. Favorece absorción de hierro no hemo.',
    needsValidation: false,
  },
  {
    name: 'Naranja (gajos sin piel)',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Cítrico. Introducir gradualmente. Rica en vitamina C — potencia absorción de hierro vegetal. Retirar membranas y semillas. No antes de 8 meses por acidez.',
    needsValidation: false,
  },
  {
    name: 'Piña',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Contiene bromelina, enzima digestiva. Efecto laxante suave. Retirar corazón duro y ojos. Puede causar irritación oral. Ofrecer en pequeñas cantidades al inicio.',
    needsValidation: true,
  },
  {
    name: 'Uvas (sin semilla, en cuartos)',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 12,
    description:
      'SIEMPRE cortar en cuartos — son un riesgo de asfixia grave si se ofrecen enteras. Sin semillas. Solo después de los 12 meses. Efecto laxante suave por fibra y agua.',
    needsValidation: false,
  },
  {
    name: 'Arándano',
    group: 'FRUIT',
    alClassification: 'ASTRINGENT',
    alScore: -0.5,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Rico en antioxidantes (antocianinas). Efecto astringente por taninos. Machacar o licuar antes de ofrecer. Puede teñir heces de azul-negro (normal).',
    needsValidation: false,
  },
  {
    name: 'Tuna (xoconostle rojo)',
    group: 'FRUIT',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Fruta mexicana tradicional del nopal. Rica en fibra y antioxidantes. Retirar cáscara y semillas duras con cuidado. Efecto astringente moderado. Ofrecer en puré.',
    needsValidation: true,
  },
  {
    name: 'Mamey',
    group: 'FRUIT',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Fruta tropical mexicana de sabor dulce y textura cremosa. Rica en vitamina B6, betacaroteno y fibra. Retirar semilla (contiene compuestos tóxicos). Ofrecer muy maduro en puré.',
    needsValidation: true,
  },
  {
    name: 'Zapote negro',
    group: 'FRUIT',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Fruta mexicana con pulpa oscura y sabor parecido al chocolate. Rico en vitamina C y fibra. Solo consumir bien maduro — verde contiene compuestos amargos y astringentes.',
    needsValidation: true,
  },
  {
    name: 'Granada',
    group: 'FRUIT',
    alClassification: 'ASTRINGENT',
    alScore: -0.4,
    isAllergen: false,
    ageMonths: 10,
    description:
      'Rica en polifenoles y taninos — efecto astringente. Ofrecer solo el jugo o los arils bien machacados sin la membrana blanca amarga. Puede teñir ropa permanentemente.',
    needsValidation: true,
  },
  {
    name: 'Ciruela mexicana (jocote) madura',
    group: 'FRUIT',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: false,
    ageMonths: 10,
    description:
      'Fruta mexicana estacional. Verde es MUY astringente (taninos); madura es más equilibrada. Retirar hueso. Ofrecer solo madura y en puré. Efecto variable según madurez.',
    needsValidation: true,
  },
];

// ============================================================
// VERDURAS (23 foods)
// ============================================================
const vegetables: FoodSeed[] = [
  {
    name: 'Zanahoria cocida',
    group: 'VEGETABLE',
    alClassification: 'ASTRINGENT',
    alScore: -0.4,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Cocer bien hasta ablandar. La pectina soluble de la zanahoria se gelifica al cocerse, con efecto astringente. Rica en betacaroteno. Excelente primer alimento.',
    needsValidation: false,
  },
  {
    name: 'Calabacita cocida',
    group: 'VEGETABLE',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Muy digestiva y de sabor suave. Alto contenido de agua. Efecto neutro en tránsito. Ideal para mezclar con otros alimentos. Excelente primera verdura.',
    needsValidation: false,
  },
  {
    name: 'Chayote cocido',
    group: 'VEGETABLE',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Vegetal mexicano muy digestivo. Alto contenido de agua y sabor suave. Efecto neutro en tránsito. Cocer hasta muy blando. Fácil de hacer puré.',
    needsValidation: false,
  },
  {
    name: 'Espinaca cocida',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Rica en magnesio y fibra — efecto laxante documentado. NO antes de 8 meses por nitratos. Blanquear brevemente y escurrir bien. Combinar con vitamina C para mejorar absorción de hierro no hemo.',
    needsValidation: false,
  },
  {
    name: 'Brócoli cocido',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Efecto laxante por fibra insoluble. Puede causar gases — introducir gradualmente. Rico en vitamina C y calcio. Cocer al vapor preserva mejor los nutrientes.',
    needsValidation: false,
  },
  {
    name: 'Papa cocida (sin cáscara)',
    group: 'VEGETABLE',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Almidón resistente con efecto astringente. Muy energético y de fácil digestión. Excelente primer alimento. Pelar antes de cocer. Sin sal ni mantequilla para bebés.',
    needsValidation: false,
  },
  {
    name: 'Camote cocido',
    group: 'VEGETABLE',
    alClassification: 'NEUTRAL',
    alScore: -0.1,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Muy nutritivo. Rico en betacaroteno, vitamina A y fibra. Textura suave y sabor dulce que los bebés aceptan bien. Cocer hasta muy blando. Sin cáscara.',
    needsValidation: false,
  },
  {
    name: 'Aguacate',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Grasa saludable monoinsaturada. Efecto laxante suave por fibra y sorbitol. Excelente fuente de energía densa para el crecimiento cerebral. Ofrecer maduro, en trozos o puré.',
    needsValidation: false,
  },
  {
    name: 'Ejote cocido',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Leguminosa fresca. Efecto laxante por fibra. Cocer bien hasta muy suave — puede ser difícil de masticar. Retirar las puntas. Buena fuente de vitaminas del complejo B.',
    needsValidation: false,
  },
  {
    name: 'Betabel cocido',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: false,
    ageMonths: 8,
    description:
      'AVISO: puede colorear heces de rojo y orina de rosa — esto es NORMAL (beeturia). NO antes de 8 meses por nitratos. Efecto laxante por fibra. Rico en folato.',
    needsValidation: false,
  },
  {
    name: 'Coliflor cocida',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Puede causar gases — introducir gradualmente. Efecto laxante por fibra insoluble y agua. Rica en vitamina C. Cocer bien antes de ofrecer. Sabor suave.',
    needsValidation: false,
  },
  {
    name: 'Nopales cocidos',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.6,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Alimento mexicano tradicional muy nutritivo. El mucílago tiene efecto laxante y prebiótico notable. Cocer bien (quita la baba) y triturar. Verificar ausencia de espinas.',
    needsValidation: false,
  },
  {
    name: 'Calabaza de Castilla cocida',
    group: 'VEGETABLE',
    alClassification: 'NEUTRAL',
    alScore: 0.1,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Variedad mexicana de calabaza. Rica en betacaroteno y vitamina A. Textura muy suave al cocer. Sabor dulce que los bebés suelen aceptar bien. Excelente primer alimento.',
    needsValidation: false,
  },
  {
    name: 'Jitomate cocido (sin piel ni semillas)',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'El jitomate crudo puede irritar la piel alrededor de la boca. Cocer reduce acidez. Retirar piel y semillas. Rico en licopeno (antioxidante) y vitamina C.',
    needsValidation: false,
  },
  {
    name: 'Pepino (sin piel ni semillas)',
    group: 'VEGETABLE',
    alClassification: 'NEUTRAL',
    alScore: 0.1,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Alto contenido de agua. Muy refrescante. Retirar piel y semillas antes de los 12 meses. Sin sal ni chile. Ofrecer en tiras para BLW o rallado.',
    needsValidation: false,
  },
  {
    name: 'Elote (granos cocidos)',
    group: 'VEGETABLE',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Retirar granos del olote y triturar o moler. Los granos enteros son riesgo de asfixia y no se digieren bien antes de los 2 años. Popular en México. Sin sal ni condimentos.',
    needsValidation: false,
  },
  {
    name: 'Jícama (rallada)',
    group: 'VEGETABLE',
    alClassification: 'NEUTRAL',
    alScore: 0.1,
    isAllergen: false,
    ageMonths: 10,
    description:
      'Tubérculo mexicano crujiente. Ofrecer rallado o en tiras muy finas — textura cruda puede ser riesgo. Rico en vitamina C y fibra prebiótica. Sin cal ni chile.',
    needsValidation: true,
  },
  {
    name: 'Pimiento morrón cocido',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Muy rico en vitamina C. Efecto laxante suave por fibra. Cocer bien y retirar piel. El rojo contiene más betacaroteno que el verde. Sin capsaicina (no es picante).',
    needsValidation: false,
  },
  {
    name: 'Acelga cocida',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Rica en magnesio y fibra — efecto laxante similar a la espinaca. NO antes de 8 meses por nitratos. Cocinar y escurrir bien. Combinar con vitamina C para absorber hierro no hemo.',
    needsValidation: false,
  },
  {
    name: 'Quelites cocidos',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Verduras silvestres mexicanas (quintoniles, verdolagas, huauzontle). Ricas en hierro, calcio y fibra. Efecto laxante por fibra. Cocer bien. Patrimonio alimentario de México.',
    needsValidation: true,
  },
  {
    name: 'Verdolagas cocidas',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Hierba comestible mexicana muy nutritiva. Rica en omega-3 vegetal (ALA) y vitamina C. Efecto laxante suave. Cocer bien. Sabor ligeramente ácido que puede mezclarse con otros purés.',
    needsValidation: true,
  },
  {
    name: 'Lechuga romana (picada fina)',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.2,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Lavar muy bien. Picar finamente — hojas enteras son riesgo de asfixia. Efecto laxante muy suave. Rica en folato. Mejor incorporar a purés que ofrecer sola.',
    needsValidation: false,
  },
  {
    name: 'Espárrago cocido',
    group: 'VEGETABLE',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'AVISO: puede cambiar el olor de la orina (efecto por ácido aspártico — completamente normal). Efecto laxante suave. Rico en folato. Cocer hasta muy blando.',
    needsValidation: false,
  },
];

// ============================================================
// PROTEÍNAS (24 foods)
// ============================================================
const proteins: FoodSeed[] = [
  {
    name: 'Pollo deshebrado cocido',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Primera carne recomendada en alimentación complementaria. Cocer bien hasta temperatura interna de 74°C. Deshebrar muy fino o en trozos BLW. Efecto astringente leve por proteína.',
    needsValidation: false,
  },
  {
    name: 'Carne de res molida cocida',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Rica en hierro hemo (mejor absorbido que el hierro vegetal). Efecto astringente leve. Cocer bien a temperatura interna de 71°C. Ofrecer en textura apropiada para la edad.',
    needsValidation: false,
  },
  {
    name: 'Pavo molido o deshebrado',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Proteína magra. Bien cocida hasta 74°C. Textura suave al desmechar. Rica en proteína, zinc y fósforo. Efecto astringente leve similar al pollo.',
    needsValidation: false,
  },
  {
    name: 'Cerdo cocido (lomo, sin grasa)',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Cocer muy bien (temperatura interna 71°C). Usar cortes magros. Deshebrar finamente. Buena fuente de tiamina (vitamina B1). Efecto astringente leve.',
    needsValidation: false,
  },
  {
    name: 'Pescado blanco cocido (tilapia, robalo)',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.1,
    isAllergen: true,
    allergenType: 'fish',
    ageMonths: 8,
    description:
      'Proteína de alto valor biológico. Alérgeno potencial — Top 9. Verificar ausencia de espinas. Rico en omega-3. Cocer completamente. Introducir junto con observación 48-72 horas.',
    needsValidation: false,
  },
  {
    name: 'Salmón cocido',
    group: 'PROTEIN',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: true,
    allergenType: 'fish',
    ageMonths: 8,
    description:
      'Excelente fuente de DHA (omega-3 para desarrollo cerebral). Alérgeno potencial. Verificar espinas. Cocer completamente. Preferir salvaje sobre cultivado. No más de 2 veces/semana.',
    needsValidation: false,
  },
  {
    name: 'Atún en agua (bajo sodio)',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: true,
    allergenType: 'fish',
    ageMonths: 9,
    description:
      'Elegir "light tuna" (menor contenido de mercurio que el "white/albacore"). Alérgeno. Verificar sodio en la lata. Máximo 2 veces por semana. Escurrir bien.',
    needsValidation: false,
  },
  {
    name: 'Sardina en aceite de oliva',
    group: 'PROTEIN',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: true,
    allergenType: 'fish',
    ageMonths: 9,
    description:
      'Excelente fuente de omega-3, vitamina D y calcio (si se comen los huesos blandos). Alérgeno. Baja en mercurio. Escurrir bien. Machacar con tenedor.',
    needsValidation: false,
  },
  {
    name: 'Huevo (yema cocida)',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: true,
    allergenType: 'egg',
    ageMonths: 6,
    description:
      'Introducir yema primero. Esperar 3 días antes de probar clara. Rica en hierro, colina y ácidos grasos esenciales. Bien cocida (evitar yema líquida por Salmonella). Alérgeno — Top 9.',
    needsValidation: false,
  },
  {
    name: 'Huevo entero cocido',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: true,
    allergenType: 'egg',
    ageMonths: 8,
    description:
      'Introducir después de yema sola. Bien cocido. Proteína completa con todos los aminoácidos esenciales. Alérgeno — Top 9. Ofrecer en trozos o rallado para BLW.',
    needsValidation: false,
  },
  {
    name: 'Frijol negro cocido',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.6,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Leguminosa mexicana fundamental. Efecto laxante por fibra soluble y prebiótica. Puede causar gases al inicio — introducir gradualmente. Combinar con arroz para proteína completa.',
    needsValidation: false,
  },
  {
    name: 'Frijol pinto cocido',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.6,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Leguminosa mexicana muy común. Efecto laxante por fibra soluble. Puede causar gases — introducir gradualmente. Cocer hasta deshacer. Machacar bien.',
    needsValidation: false,
  },
  {
    name: 'Lenteja cocida',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.6,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Leguminosa muy digestiva y primera recomendada. Rica en hierro vegetal y proteína. Se deshace al cocer — textura perfecta para bebés. Efecto laxante suave a moderado.',
    needsValidation: false,
  },
  {
    name: 'Lenteja roja cocida',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.6,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Sin cáscara — se deshace completamente al cocer, textura perfecta para bebés. Muy digerible. Efecto laxante suave. Cocción más rápida que la lenteja verde.',
    needsValidation: false,
  },
  {
    name: 'Garbanzo cocido',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Puede causar gases — introducir con paciencia. Ofrecer bien cocido y machacado (hummus sin tahini y sin sal es ideal). Rico en proteína, zinc y fibra prebiótica.',
    needsValidation: false,
  },
  {
    name: 'Haba cocida (sin cáscara)',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Leguminosa mexicana. Retirar cáscara exterior. Puede causar gas. PRECAUCIÓN: contraindicada en deficiencia de G6PD (favismo) — consultar pediatra si hay historial familiar.',
    needsValidation: true,
  },
  {
    name: 'Chícharo cocido',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Leguminosa fresca pequeña. Machacar o colar para bebés menores de 9 meses — riesgo de asfixia si se ofrecen enteros. Rica en proteína vegetal, vitamina K y C.',
    needsValidation: false,
  },
  {
    name: 'Frijol blanco (alubias) cocido',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Leguminosa suave y fácil de machacar. Rica en hierro vegetal y proteína. Puede causar gases. Cocer hasta muy blando. Textura cremosa ideal para purés.',
    needsValidation: false,
  },
  {
    name: 'Yogurt natural entero (sin azúcar)',
    group: 'PROTEIN',
    alClassification: 'LAXATIVE',
    alScore: 0.4,
    isAllergen: true,
    allergenType: 'dairy',
    ageMonths: 6,
    description:
      'Probiótico natural. Efecto laxante suave por cultivos activos. La fermentación facilita digestión de lactosa. Sin azúcar, sin saborizantes, sin frutas procesadas. Alérgeno — lácteos.',
    needsValidation: false,
  },
  {
    name: 'Queso panela',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: true,
    allergenType: 'dairy',
    ageMonths: 8,
    description:
      'Queso fresco mexicano bajo en sodio (comparado con otros quesos). Efecto astringente leve por caseína. Ofrecer en trozos blandos o rallado. Alérgeno — lácteos.',
    needsValidation: false,
  },
  {
    name: 'Queso requesón',
    group: 'PROTEIN',
    alClassification: 'NEUTRAL',
    alScore: -0.1,
    isAllergen: true,
    allergenType: 'dairy',
    ageMonths: 8,
    description:
      'Queso suave y cremoso, bajo en sodio. Textura untable ideal para bebés. Buena fuente de calcio y proteína. Alérgeno — lácteos. Verificar sin sal añadida.',
    needsValidation: false,
  },
  {
    name: 'Queso cottage',
    group: 'PROTEIN',
    alClassification: 'NEUTRAL',
    alScore: -0.1,
    isAllergen: true,
    allergenType: 'dairy',
    ageMonths: 8,
    description:
      'Queso suave de grano pequeño. Rico en proteína y calcio. Bajo en grasa. Verificar bajo sodio. Alérgeno — lácteos. Textura suave fácil de manejar para bebés.',
    needsValidation: false,
  },
  {
    name: 'Hígado de pollo cocido',
    group: 'PROTEIN',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Superalimento en hierro hemo y vitamina A. Ofrecer MÁXIMO 1-2 veces por semana (exceso de vitamina A preformada es tóxico). Bien cocido. Texture granulada — mezclar con puré.',
    needsValidation: false,
  },
  {
    name: 'Huitlacoche cocido',
    group: 'PROTEIN',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: false,
    ageMonths: 12,
    description:
      'Hongo del maíz — delicadeza culinaria mexicana. Buena fuente de proteína vegetal y aminoácidos esenciales. Introducir después de los 12 meses. Cocer bien. Sabor fuerte — combinar con otros purés.',
    needsValidation: true,
  },
];

// ============================================================
// CEREALES Y TUBÉRCULOS (17 foods)
// ============================================================
const cerealsTubers: FoodSeed[] = [
  {
    name: 'Arroz blanco cocido',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.6,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Almidón refinado — muy astringente. Base del tratamiento dietético de la diarrea. Digerible y de baja carga alergénica. Primer cereal cultural en México. Sin sal.',
    needsValidation: false,
  },
  {
    name: 'Arroz integral cocido',
    group: 'CEREAL_TUBER',
    alClassification: 'NEUTRAL',
    alScore: -0.2,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Más fibra que el arroz blanco — efecto entre astringente y neutro. Requiere cocción más larga (45 min). Rico en magnesio y fibra. Mejor opción nutricional que el blanco.',
    needsValidation: false,
  },
  {
    name: 'Avena en hojuelas cocida',
    group: 'CEREAL_TUBER',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: true,
    allergenType: 'gluten',
    ageMonths: 6,
    description:
      'Rica en beta-glucano — fibra soluble con efecto laxante documentado. Avena es naturalmente sin gluten pero se contamina frecuentemente. Buscar certificación "libre de gluten" si hay sensibilidad.',
    needsValidation: false,
  },
  {
    name: 'Tortilla de maíz',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Alimento básico mexicano. La nixtamalización aumenta disponibilidad de niacina y calcio. Sin gluten. Efecto astringente moderado por almidón. Ofrecer en tiras blandas para BLW.',
    needsValidation: false,
  },
  {
    name: 'Tortilla de harina integral',
    group: 'CEREAL_TUBER',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: true,
    allergenType: 'gluten',
    ageMonths: 9,
    description:
      'Más fibra que la tortilla de harina blanca. Contiene gluten. Efecto neutro. Ofrecer en tiras para BLW. Verificar bajo contenido de sodio y sin grasas hidrogenadas.',
    needsValidation: false,
  },
  {
    name: 'Pan integral',
    group: 'CEREAL_TUBER',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: true,
    allergenType: 'gluten',
    ageMonths: 8,
    description:
      'Fibra de trigo integral con efecto laxante suave. Contiene gluten. Ofrecer en tiras para BLW — el pan se ablanda con saliva fácilmente. Verificar bajo sodio (muchos panes comerciales tienen exceso).',
    needsValidation: false,
  },
  {
    name: 'Pan blanco',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: true,
    allergenType: 'gluten',
    ageMonths: 8,
    description:
      'Bajo en fibra. Efecto astringente por almidón refinado. Contiene gluten. Preferir pan integral. Verificar bajo sodio. Ofrecer en tiras para BLW.',
    needsValidation: false,
  },
  {
    name: 'Pasta cocida (al dente muy suave)',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: true,
    allergenType: 'gluten',
    ageMonths: 7,
    description:
      'Cereal de trigo. Contiene gluten — introducir gradualmente. Cocer hasta muy suave para BLW (más allá del al dente normal). Formas cortas como penne o fusilli son más seguros.',
    needsValidation: false,
  },
  {
    name: 'Cereal de arroz infantil (enriquecido)',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.5,
    isAllergen: false,
    ageMonths: 4,
    description:
      'Cereal específico para bebés enriquecido con hierro. Muy astringente. Preparar con leche materna o fórmula. Primer alimento en guías tradicionales. Consultar pediatra para edad de inicio.',
    needsValidation: false,
  },
  {
    name: 'Galleta de arroz sin sal',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.4,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Snack de fácil agarre para BLW. Efecto astringente por almidón de arroz. Verificar ausencia de sal, azúcar y aditivos. Se ablanda con saliva — buena opción de textura progresiva.',
    needsValidation: false,
  },
  {
    name: 'Cuscús cocido',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: true,
    allergenType: 'gluten',
    ageMonths: 8,
    description:
      'Sémola de trigo de cocción muy rápida (5 min). Contiene gluten. Efecto astringente moderado. Textura suave ideal para bebés. Ofrecer sin sal. Menos común en México.',
    needsValidation: false,
  },
  {
    name: 'Amaranto cocido',
    group: 'CEREAL_TUBER',
    alClassification: 'NEUTRAL',
    alScore: 0.1,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Pseudocereal mexicano ancestral, sin gluten. Proteína completa con todos los aminoácidos esenciales. Muy nutritivo. Cocer como papilla o agregar molido a otros purés.',
    needsValidation: false,
  },
  {
    name: 'Quinoa cocida',
    group: 'CEREAL_TUBER',
    alClassification: 'NEUTRAL',
    alScore: 0.1,
    isAllergen: false,
    ageMonths: 7,
    description:
      'Pseudocereal sin gluten con proteína completa. Remojar mínimo 8 horas y enjuagar muy bien para eliminar saponinas (amargas). Cocer hasta que se abran los granos.',
    needsValidation: false,
  },
  {
    name: 'Polenta (masa de maíz cocida)',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.3,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Maíz molido cocido. Sin gluten. Textura muy suave y moldeable. Base para atole. Efecto astringente moderado por almidón de maíz. Popular en cocina mexicana.',
    needsValidation: false,
  },
  {
    name: 'Plátano macho verde cocido',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.8,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Verde contiene almidón resistente tipo 2 — el más astringente del grupo. Cocer bien. Al madurar pierde el efecto astringente. Muy útil para diarrea. Base del atole astringente.',
    needsValidation: false,
  },
  {
    name: 'Elote (masa preparada — atole)',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Maíz tierno procesado como bebida espesa. Sin azúcar ni canela para bebés. Efecto astringente leve. Preparación tradicional mexicana. Fuente de carbohidratos y energía.',
    needsValidation: true,
  },
  {
    name: 'Membrillo cocido',
    group: 'CEREAL_TUBER',
    alClassification: 'ASTRINGENT',
    alScore: -0.8,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Fruta muy astringente (taninos + pectina gelificante). Se clasifica en cereales/tubérculos por su uso clínico similar al arroz para diarrea. NUNCA crudo. Cocer bien y colar.',
    needsValidation: true,
  },
];

// ============================================================
// GRASAS SALUDABLES (12 foods)
// ============================================================
const healthyFats: FoodSeed[] = [
  {
    name: 'Aceite de oliva extra virgen',
    group: 'HEALTHY_FAT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Grasa monoinsaturada de alta calidad. Agrega 1-2 cucharaditas a los purés para potenciar absorción de vitaminas liposolubles A, D, E, K. No calentar a temperatura muy alta.',
    needsValidation: false,
  },
  {
    name: 'Aceite de aguacate',
    group: 'HEALTHY_FAT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 6,
    description:
      'Grasa monoinsaturada producida en México. Punto de humo alto — ideal para cocinar. Similar al aceite de oliva en perfil nutricional. Sabor neutro.',
    needsValidation: false,
  },
  {
    name: 'Mantequilla sin sal',
    group: 'HEALTHY_FAT',
    alClassification: 'NEUTRAL',
    alScore: -0.1,
    isAllergen: true,
    allergenType: 'dairy',
    ageMonths: 8,
    description:
      'Grasa saturada. SIN SAL obligatoriamente. Aporta vitaminas liposolubles A, D, E, K. Alérgeno — lácteos. Usar en pequeñas cantidades sobre purés o para cocinar.',
    needsValidation: false,
  },
  {
    name: 'Ghee (mantequilla clarificada)',
    group: 'HEALTHY_FAT',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Mantequilla clarificada — se elimina la caseína (proteína de la leche). Bien tolerado por bebés con sensibilidad leve a lácteos (NO alergia confirmada). Punto de humo alto.',
    needsValidation: true,
  },
  {
    name: 'Aceite de coco virgen',
    group: 'HEALTHY_FAT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 8,
    description:
      'Grasa de cadena media (MCT). Efecto laxante en cantidades moderadas — usar pocas cantidades. Popular en cocina tropical mexicana. Sabor suave a coco.',
    needsValidation: true,
  },
  {
    name: 'Crema de cacahuate (sin sal, sin azúcar)',
    group: 'HEALTHY_FAT',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: true,
    allergenType: 'peanut',
    ageMonths: 6,
    description:
      'INTRODUCIR TEMPRANO — evidencia LEAP (Learning Early About Peanut Allergy) demuestra que reduce riesgo de alergia. Diluir bien en puré. NUNCA en trozos (asfixia). Alérgeno — cacahuate (Top 9).',
    needsValidation: false,
  },
  {
    name: 'Tahini (pasta de ajonjolí)',
    group: 'HEALTHY_FAT',
    alClassification: 'NEUTRAL',
    alScore: 0.0,
    isAllergen: true,
    allergenType: 'sesame',
    ageMonths: 8,
    description:
      'Alérgeno potencial — ajonjolí (Top 9 en EE.UU. desde 2023). Rica en calcio y zinc. Diluir bien en puré. Introducir gradualmente con observación 48-72 horas.',
    needsValidation: false,
  },
  {
    name: 'Crema de almendras (sin sal)',
    group: 'HEALTHY_FAT',
    alClassification: 'ASTRINGENT',
    alScore: -0.2,
    isAllergen: true,
    allergenType: 'tree_nuts',
    ageMonths: 8,
    description:
      'Alérgeno — frutos secos (Top 9). Introducir diluida en puré. Rica en vitamina E y calcio. NUNCA en trozos. Introducir con observación 48-72 horas.',
    needsValidation: false,
  },
  {
    name: 'Semillas de chía remojadas',
    group: 'HEALTHY_FAT',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 9,
    description:
      'SIEMPRE remojar mínimo 20 minutos antes de ofrecer — forman un gel que facilita el tránsito. Efecto laxante notable por fibra soluble. Ricas en omega-3 ALA.',
    needsValidation: false,
  },
  {
    name: 'Semillas de girasol molidas',
    group: 'HEALTHY_FAT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 9,
    description:
      'MOLER antes de ofrecer — semillas enteras son riesgo de asfixia. Rica en vitamina E, magnesio y ácidos grasos poliinsaturados. Agregar a purés.',
    needsValidation: false,
  },
  {
    name: 'Pepita de calabaza molida',
    group: 'HEALTHY_FAT',
    alClassification: 'LAXATIVE',
    alScore: 0.3,
    isAllergen: false,
    ageMonths: 9,
    description:
      'Moler antes de ofrecer. Rica en zinc y proteína vegetal. Semilla mexicana tradicional — parte de la cocina prehispánica. Agregar a purés o sopas.',
    needsValidation: false,
  },
  {
    name: 'Linaza molida',
    group: 'HEALTHY_FAT',
    alClassification: 'LAXATIVE',
    alScore: 0.5,
    isAllergen: false,
    ageMonths: 9,
    description:
      'MOLER siempre — la linaza entera pasa sin absorberse. Efecto laxante notable por mucílago y fibra soluble. Rica en omega-3 ALA (ácido alfa-linolénico). Agregar a purés.',
    needsValidation: false,
  },
];

// ============================================================
// COMBINED CATALOG
// ============================================================
const foods: FoodSeed[] = [
  ...fruits,
  ...vegetables,
  ...proteins,
  ...cerealsTubers,
  ...healthyFats,
];

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

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
