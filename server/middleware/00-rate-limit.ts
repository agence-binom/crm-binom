import { createError, getRequestHeader, getRequestURL } from 'h3'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 120

type Bucket = { count: number, resetAt: number }

// Un seul proxy de confiance devant Nitro (le reverse proxy de Coolify) : il ajoute lui-même
// l'IP réelle du client en dernière position de l'en-tête, donc c'est la seule valeur qu'un
// client ne peut pas falsifier. Prendre le premier élément (ce que le client a pu écrire
// lui-même dans sa requête) rendrait la limite contournable en envoyant une valeur différente à
// chaque appel - à ne pas changer sans revoir le nombre de sauts de confiance.
function getClientIp(event: Parameters<typeof getRequestURL>[0]) {
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',').pop()?.trim()
  return event.node.req.socket.remoteAddress ?? 'unknown'
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api')) return

  const storage = useStorage<Bucket>('rate-limit')
  const ip = getClientIp(event) ?? 'unknown'
  const key = ip.replace(/[^a-zA-Z0-9._-]/g, '_')
  const now = Date.now()

  const bucket = await storage.getItem(key)

  if (!bucket || now > bucket.resetAt) {
    await storage.setItem(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  bucket.count += 1
  if (bucket.count > MAX_REQUESTS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests'
    })
  }

  await storage.setItem(key, bucket)
})
