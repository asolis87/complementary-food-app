/**
 * Stub: useFoodExposure - future feature placeholder
 * TODO: Implement when food exposure tracking is added
 */

export interface FoodExposureReturn {
  getExposure: (id: string) => undefined
  getTimesOffered: (id: string) => number
  trackExposure: (id: string) => Promise<void>
  fetch: (id?: string | string[]) => Promise<void>
}

export function useFoodExposure(): FoodExposureReturn {
  return {
    getExposure: (_id: string) => undefined,
    getTimesOffered: (_id: string) => 0,
    trackExposure: async (_id: string) => {},
    fetch: async (_id?: string | string[]) => {},
  }
}
