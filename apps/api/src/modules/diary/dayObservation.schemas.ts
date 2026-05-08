/**
 * Zod validation schemas for the DayObservation routes.
 * Spec: REQ-B1, REQ-B2, REQ-B3, REQ-B4 — day-level observation CRUD.
 * Design § 3 — API surface for day-observation endpoints.
 */

import { z } from 'zod'
import { StoolType, SymptomType } from '@pakulab/shared'

// ── Date regex: YYYY-MM-DD ────────────────────────────────────────────────────

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

// ── PUT /api/day-observation — idempotent upsert ──────────────────────────────

/**
 * Request body for PUT /api/day-observation.
 * All fields except babyProfileId and date are optional — an empty observation is valid (REQ-B2).
 */
export const upsertBodySchema = z.object({
  babyProfileId: z.string().cuid(),
  date: dateSchema,
  stool: z.nativeEnum(StoolType).nullable().optional(),
  symptoms: z
    .array(z.nativeEnum(SymptomType))
    .transform((arr) => Array.from(new Set(arr))) // dedup first (REQ-B3)
    .pipe(z.array(z.nativeEnum(SymptomType)).max(10, 'Maximum 10 symptoms allowed')) // max after dedup
    .optional()
    .default([]),
  notes: z.string().max(500, 'Notes must be at most 500 characters').nullable().optional(),
})

export type UpsertBodyInput = z.infer<typeof upsertBodySchema>

// ── GET /api/day-observation — fetch by composite key ────────────────────────

export const getQuerySchema = z.object({
  babyProfileId: z.string().cuid(),
  date: dateSchema,
})

export type GetQueryInput = z.infer<typeof getQuerySchema>

// ── DELETE /api/day-observation — delete by composite key ────────────────────

/** Same shape as getQuerySchema — composite key (babyProfileId, date) */
export const deleteQuerySchema = z.object({
  babyProfileId: z.string().cuid(),
  date: dateSchema,
})

export type DeleteQueryInput = z.infer<typeof deleteQuerySchema>

// ── Response shape ────────────────────────────────────────────────────────────

/**
 * Typed response DTO for a DayObservation row.
 * Matches the DayObservation interface from @pakulab/shared.
 */
export const dayObservationResponseSchema = z.object({
  id: z.string(),
  babyProfileId: z.string(),
  date: z.string(), // serialised as YYYY-MM-DD
  stool: z.nativeEnum(StoolType).nullable(),
  symptoms: z.array(z.nativeEnum(SymptomType)),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type DayObservationResponse = z.infer<typeof dayObservationResponseSchema>
