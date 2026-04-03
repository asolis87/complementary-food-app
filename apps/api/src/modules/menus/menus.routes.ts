/**
 * Weekly menu planner routes — Pro only.
 * Spec: REQ-MENU-01 — GET/POST/PATCH/DELETE for weekly menus.
 *
 * Architecture:
 * - GET /api/menus?babyProfileId=&weekStart= — get menu or null (lazy creation)
 * - POST /api/menus — create menu + 7 days
 * - PATCH /api/menus/:menuId/meals — upsert meal slot (assign/replace/clear plate)
 * - DELETE /api/menus/:menuId — soft-delete menu
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import {
  getMenuQuerySchema,
  createMenuSchema,
  patchMealSchema,
  menuIdParamSchema,
  serveMealSchema,
  serveMealQuerySchema,
} from './menus.schemas.js'
import {
  getWeekMenu,
  createWeekMenu,
  upsertMealSlot,
  softDeleteMenu,
  serveMeal,
  AlreadyServedError,
  EmptyPlateError,
} from './menus.service.js'

export const menusRoutes: FastifyPluginAsync = async (fastify) => {
  // All menu routes require Pro tier
  fastify.addHook('preHandler', requireAuth)
  fastify.addHook('preHandler', requireTier('PRO', { code: 'INSUFFICIENT_TIER' }))

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/menus — Get menu by babyProfileId + weekStart
  // Returns null if no menu exists (frontend decides to auto-create or show CTA)
  // ───────────────────────────────────────────────────────────────────────────
  fastify.get('/', async (request, reply) => {
    const query = getMenuQuerySchema.parse(request.query)
    const userId = request.user!.id

    const menu = await getWeekMenu(
      fastify.prisma,
      userId,
      query.babyProfileId,
      query.weekStart,
    )

    reply.send(menu)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/menus — Create a new weekly menu with 7 days
  // Fails if menu already exists for this user/profile/week (409-like behavior with 400)
  // ───────────────────────────────────────────────────────────────────────────
  fastify.post('/', async (request, reply) => {
    const input = createMenuSchema.parse(request.body)
    const userId = request.user!.id

    const menu = await createWeekMenu(fastify.prisma, userId, {
      babyProfileId: input.babyProfileId,
      weekStart: input.weekStart,
      name: input.name,
    })

    reply.status(201).send(menu)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // PATCH /api/menus/:menuId/meals — Upsert a meal slot
  // Body: { dayOfWeek: 0-6, mealType: MealType, plateId: string|null, notes?: string }
  // Assigns, replaces, or clears (plateId=null) a plate for a specific day+mealType
  // ───────────────────────────────────────────────────────────────────────────
  fastify.patch('/:menuId/meals', async (request, reply) => {
    const { menuId } = menuIdParamSchema.parse(request.params)
    const input = patchMealSchema.parse(request.body)
    const userId = request.user!.id

    const result = await upsertMealSlot(fastify.prisma, userId, menuId, {
      dayOfWeek: input.dayOfWeek,
      mealType: input.mealType,
      plateId: input.plateId,
      notes: input.notes,
    })

    reply.send({ meal: result.meal, balanceScore: result.balanceScore })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE /api/menus/:menuId — Soft-delete a menu
  // Sets deletedAt timestamp, menu won't appear in future GET responses
  // ───────────────────────────────────────────────────────────────────────────
  fastify.delete('/:menuId', async (request, reply) => {
    const { menuId } = menuIdParamSchema.parse(request.params)
    const userId = request.user!.id

    await softDeleteMenu(fastify.prisma, userId, menuId)

    reply.status(204).send()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/menus/:menuId/meals/serve — Serve a meal
  // Converts plate items into FoodLog entries for the diary.
  // Query param: ?force=true allows re-serving an already-served meal.
  // ───────────────────────────────────────────────────────────────────────────
  fastify.post('/:menuId/meals/serve', async (request, reply) => {
    const { menuId } = menuIdParamSchema.parse(request.params)
    const body = serveMealSchema.parse(request.body)
    const query = serveMealQuerySchema.parse(request.query)
    const userId = request.user!.id

    try {
      const result = await serveMeal(
        fastify.prisma,
        userId,
        menuId,
        body,
        query.force,
      )

      reply.status(201).send({ data: result })
    } catch (error) {
      // Handle specific serve errors with proper status codes
      if (error instanceof AlreadyServedError) {
        reply.status(409).send({
          error: error.code,
          message: 'This meal has already been served',
          servedAt: error.servedAt.toISOString(),
        })
        return
      }

      if (error instanceof EmptyPlateError) {
        reply.status(400).send({
          error: error.code,
          message: error.message,
        })
        return
      }

      // Re-throw other errors (NotFoundError, ForbiddenError) to be handled by global error handler
      throw error
    }
  })
}
