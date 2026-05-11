/**
 * Strip diacritical marks (accents, tildes) for accent-insensitive matching.
 * Example: normalizeAccents('Plátano') === 'Platano'
 */
export function normalizeAccents(str: string): string {
  // U+0300–U+036F covers combining diacritical marks (acute, tilde, grave, etc.)
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
}
