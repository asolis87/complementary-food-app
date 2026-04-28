/**
 * HTML/XSS sanitization for free-form user input.
 * Audit H-03 (A03:2021) — Strips all HTML tags and attributes from text fields
 * before persistence as defense-in-depth (Vue templates already escape on render).
 */

import sanitizeHtml from 'sanitize-html'

const STRIP_ALL_HTML: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
}

/**
 * Removes all HTML markup from a string and trims whitespace.
 * Returns an empty string for empty or whitespace-only input.
 */
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, STRIP_ALL_HTML).trim()
}

/**
 * Zod transform helper: sanitizes when value is a string, passes null/undefined through.
 * Generic over the input type so Zod's inferred output type is preserved
 * (e.g. `.optional()` stays `string | undefined`, not widened to include null).
 */
export function sanitizeOptional<T extends string | null | undefined>(input: T): T {
  if (input == null) return input
  return sanitizeText(input) as T
}
