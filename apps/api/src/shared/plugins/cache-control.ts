/**
 * Fastify plugin: default `Cache-Control: no-store, private` on private API
 * responses (audit M-05, A05:2021).
 *
 * Defense-in-depth against PWA / browser / proxy caches storing personal
 * data (baby profiles, diary entries, menus). The SW is also tightened to
 * NetworkOnly for these routes, but this header protects against shared
 * proxies and any cache layer the SW does not control.
 *
 * Allowlist: paths under PUBLIC_PREFIXES keep their default headers so the
 * food catalog (intentionally cacheable) is not affected.
 */

import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const PUBLIC_PREFIXES = ['/api/foods']

function isPublicPath(url: string): boolean {
  const path = url.split('?')[0] ?? ''
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

const cacheControlPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (!request.url.startsWith('/api/')) return payload
    if (isPublicPath(request.url)) return payload
    if (reply.getHeader('cache-control')) return payload
    reply.header('Cache-Control', 'no-store, private')
    return payload
  })
}

export default fp(cacheControlPlugin, {
  name: 'cache-control',
})
