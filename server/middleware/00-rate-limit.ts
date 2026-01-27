import { createError, getRequestHeader, getRequestURL } from 'h3'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 120

type Bucket = { count: number, resetAt: number }
const buckets = new Map<string, Bucket>()

function getClientIp(event: Parameters<typeof getRequestURL>[0]) {
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim()
  return event.node.req.socket.remoteAddress ?? 'unknown'
}

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api')) return

  const ip = getClientIp(event)
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  bucket.count += 1
  if (bucket.count > MAX_REQUESTS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests'
    })
  }
})
