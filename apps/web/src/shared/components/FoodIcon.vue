/**
 * FoodIcon.vue
 *
 * Maps food names to Phosphor icon components for the dashboard.
 * Falls back to a category icon when no specific match is found.
 */
<script setup lang="ts">
import { computed } from 'vue'
import type { Food, FoodGroup } from '@pakulab/shared'
import {
  PhAppleLogo,
  PhOrange,
  PhOrangeSlice,
  PhBread,
  PhCarrot,
  PhPepper,
  PhLeaf,
  PhGrains,
  PhBowlFood,
  PhBowlSteam,
  PhCookingPot,
  PhEgg,
  PhEggCrack,
  PhFish,
  PhFishSimple,
  PhNut,
  PhAcorn,
  PhAvocado,
  PhChefHat,
  PhForkKnife,
  PhDrop,
} from '@phosphor-icons/vue'

/** Props */
const props = defineProps<{
  /** Food item to display icon for */
  food: Food
  /** Icon size in pixels (default: 24) */
  size?: number
  /** Icon weight variant */
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}>()

/** Category fallback icons per food group */
const CATEGORY_ICONS: Record<FoodGroup, typeof PhAppleLogo> = {
  FRUIT: PhAppleLogo,
  VEGETABLE: PhCarrot,
  PROTEIN: PhEgg,
  CEREAL_TUBER: PhGrains,
  HEALTHY_FAT: PhNut,
}

/** Keyword-to-icon map for each food group (lowercase keys) */
const ICON_KEYWORDS: Record<FoodGroup, Record<string, typeof PhAppleLogo>> = {
  FRUIT: {
    // Citrus
    naranja: PhOrange,
    orange: PhOrange,
    mandarina: PhOrange,
    pomelo: PhOrange,
    limón: PhOrange,
    lemon: PhOrange,
    lima: PhOrange,
    // Berries
    frutilla: PhAppleLogo,
    strawberry: PhAppleLogo,
    arándano: PhAppleLogo,
    blueberry: PhAppleLogo,
    mora: PhAppleLogo,
    raspberry: PhAppleLogo,
    cereza: PhAppleLogo,
    cherry: PhAppleLogo,
    // Stone fruits
    durazno: PhAppleLogo,
    peach: PhAppleLogo,
    damasco: PhAppleLogo,
    albaricoque: PhAppleLogo,
    ciruela: PhAppleLogo,
    plum: PhAppleLogo,
    // Tropicals
    banana: PhOrange,
    mango: PhAppleLogo,
    papaya: PhAppleLogo,
    piña: PhOrangeSlice,
    kiwi: PhLeaf,
    higo: PhLeaf,
    granada: PhAppleLogo,
    // Grapes
    uva: PhAppleLogo,
    grape: PhAppleLogo,
    pasas: PhAppleLogo,
    // Generic
    manzana: PhAppleLogo,
    apple: PhAppleLogo,
    pera: PhAppleLogo,
    pear: PhAppleLogo,
  },
  VEGETABLE: {
    // Root vegetables
    zanahoria: PhCarrot,
    carrot: PhCarrot,
    betarraga: PhCarrot,
    beet: PhCarrot,
    nabo: PhCarrot,
    rábano: PhCarrot,
    radish: PhCarrot,
    papa: PhBowlFood,
    potato: PhBowlFood,
    patata: PhBowlFood,
    boniato: PhBowlFood,
    camote: PhBowlFood,
    // Greens
    lechuga: PhLeaf,
    lettuce: PhLeaf,
    espinaca: PhLeaf,
    spinach: PhLeaf,
    kale: PhLeaf,
    col: PhLeaf,
    cabbage: PhLeaf,
    brócoli: PhLeaf,
    broccoli: PhLeaf,
    coliflor: PhLeaf,
    cauliflower: PhLeaf,
    // Salad
    rúcula: PhLeaf,
    arugula: PhLeaf,
    radicheta: PhLeaf,
    endibia: PhLeaf,
    radicchio: PhLeaf,
    // Tomatoes & peppers
    tomate: PhPepper,
    tomato: PhPepper,
    pimiento: PhPepper,
    pepper: PhPepper,
    morrón: PhPepper,
    chile: PhPepper,
    ají: PhPepper,
    // Corn & squash
    choclo: PhCarrot,
    maíz: PhCarrot,
    corn: PhCarrot,
    zapallo: PhCarrot,
    calabaza: PhCarrot,
    pumpkin: PhCarrot,
    zapallito: PhCarrot,
    zucchini: PhCarrot,
    // Alliums
    cebolla: PhLeaf,
    onion: PhLeaf,
    ajo: PhLeaf,
    garlic: PhLeaf,
    puerro: PhLeaf,
    leek: PhLeaf,
    ciboulette: PhLeaf,
    chive: PhLeaf,
    // Others
    apio: PhLeaf,
    celery: PhLeaf,
    hongo: PhLeaf,
    mushroom: PhLeaf,
    champiñón: PhLeaf,
    palta: PhAvocado,
    aguacate: PhAvocado,
    berenjena: PhPepper,
    eggplant: PhPepper,
    pepino: PhLeaf,
    cucumber: PhLeaf,
    chaucha: PhLeaf,
    greenbean: PhLeaf,
    arveja: PhLeaf,
    pea: PhLeaf,
    poroto: PhLeaf,
  },
  PROTEIN: {
    // Eggs
    huevo: PhEgg,
    egg: PhEgg,
    huevos: PhEgg,
    // Meat
    carne: PhForkKnife,
    meat: PhForkKnife,
    res: PhForkKnife,
    beef: PhForkKnife,
    cerdo: PhForkKnife,
    pork: PhForkKnife,
    cordero: PhForkKnife,
    lamb: PhForkKnife,
    conejo: PhForkKnife,
    rabbit: PhForkKnife,
    // Poultry
    pollo: PhChefHat,
    chicken: PhChefHat,
    pavo: PhChefHat,
    turkey: PhChefHat,
    pato: PhChefHat,
    duck: PhChefHat,
    // Fish
    pescado: PhFish,
    fish: PhFish,
    atún: PhFishSimple,
    tuna: PhFishSimple,
    salmón: PhFishSimple,
    salmon: PhFishSimple,
    merluza: PhFishSimple,
    bacalao: PhFishSimple,
    trucha: PhFishSimple,
    trout: PhFishSimple,
    sardina: PhFishSimple,
    sardine: PhFishSimple,
    anchoa: PhFishSimple,
    anchovy: PhFishSimple,
    // Seafood
    camarón: PhFish,
    shrimp: PhFish,
    langosta: PhFish,
    lobster: PhFish,
    langoustine: PhFish,
    cangrejo: PhFish,
    crab: PhFish,
    pulpo: PhFish,
    octopus: PhFish,
    calamar: PhFish,
    squid: PhFish,
    mejillón: PhFish,
    mussel: PhFish,
    ostra: PhFish,
    oyster: PhFish,
    // Dairy & cheese
    queso: PhNut,
    cheese: PhNut,
    // Legumes (as protein)
    poroto: PhGrains,
    frijol: PhGrains,
    lenteja: PhGrains,
    lentil: PhGrains,
    garbanzo: PhGrains,
    chickpea: PhGrains,
    haba: PhGrains,
    soja: PhGrains,
    tofu: PhGrains,
    // Nuts (sometimes protein)
    maní: PhNut,
    peanut: PhNut,
    almendra: PhNut,
    almond: PhNut,
    // Other
    foie: PhForkKnife,
    paté: PhForkKnife,
  },
  CEREAL_TUBER: {
    // Grains
    arroz: PhBowlFood,
    rice: PhBowlFood,
    avena: PhGrains,
    oat: PhGrains,
    quinoa: PhGrains,
    trigo: PhGrains,
    wheat: PhGrains,
    cebada: PhGrains,
    barley: PhGrains,
    centeno: PhGrains,
    rye: PhGrains,
    mijo: PhGrains,
    millet: PhGrains,
    sorgo: PhGrains,
    sorghum: PhGrains,
    // Bread
    pan: PhBread,
    bread: PhBread,
    tortilla: PhBread,
    arepa: PhBread,
    focaccia: PhBread,
    // Pasta
    pasta: PhBowlSteam,
    fideos: PhBowlSteam,
    noodles: PhBowlSteam,
    spaghetti: PhBowlSteam,
    macarrones: PhBowlSteam,
    // Other
    sémola: PhGrains,
    semolina: PhGrains,
    granola: PhGrains,
    galleta: PhBread,
    cookie: PhBread,
    crackers: PhBread,
    // Tubers
    papa: PhBowlFood,
    potato: PhBowlFood,
    patata: PhBowlFood,
    boniato: PhBowlFood,
    camote: PhBowlFood,
    yuca: PhBowlFood,
    cassava: PhBowlFood,
  },
  HEALTHY_FAT: {
    // Avocado
    palta: PhAvocado,
    aguacate: PhAvocado,
    avocado: PhAvocado,
    // Oils
    aceite: PhDrop,
    oil: PhDrop,
    oliva: PhAvocado,
    olive: PhAvocado,
    aceituna: PhAvocado,
    // Nuts
    almendra: PhNut,
    almond: PhNut,
    nuez: PhAcorn,
    walnut: PhAcorn,
    castaña: PhAcorn,
    chestnut: PhAcorn,
    pistacho: PhNut,
    pistachio: PhNut,
    maní: PhNut,
    peanut: PhNut,
    coco: PhNut,
    coconut: PhNut,
    pacana: PhNut,
    pecan: PhNut,
    anacardo: PhNut,
    cashew: PhNut,
    // Seeds
    sésamo: PhGrains,
    sesame: PhGrains,
    linaza: PhGrains,
    flaxseed: PhGrains,
    chia: PhGrains,
    hemp: PhGrains,
    cáñamo: PhGrains,
    // Butter
    ghee: PhCookingPot,
  },
}

function getIconForFood(food: Food): typeof PhAppleLogo {
  const group = food.group
  const nameLower = food.name.toLowerCase()

  // Try keyword match (first match wins)
  const keywords = ICON_KEYWORDS[group]
  if (keywords) {
    for (const [keyword, icon] of Object.entries(keywords)) {
      if (nameLower.includes(keyword)) {
        return icon
      }
    }
  }

  // Fallback to category icon
  return CATEGORY_ICONS[group]
}

const iconSize = computed(() => props.size ?? 24)
const iconWeight = computed(() => props.weight ?? 'regular')
const iconComponent = computed(() => getIconForFood(props.food))
</script>

<template>
  <component
    :is="iconComponent"
    :size="iconSize"
    :weight="iconWeight"
    class="food-icon"
    aria-hidden="true"
  />
</template>

<style scoped>
.food-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>