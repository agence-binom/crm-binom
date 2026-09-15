import { createError, getRequestHeader, getRequestURL } from 'h3'

const WINDOW_MS = 60_000

// Hors production, une seule IP (le runner CI, ou un poste de dev) simule à elle seule des
// dizaines d'utilisateurs distincts sur des tests e2e qui tournent en quelques dizaines de
// secondes - rien à voir avec le trafic d'un vrai visiteur, que la limite de prod vise à
// contenir. Sans ce relèvement, la suite e2e épuise le budget avant la fin et échoue sur des 429
// pris pour des bugs applicatifs (voir le commentaire dans .github/workflows/ci.yml), même en
// isolant chaque navigateur dans sa propre invocation. Même pattern que emailAndPassword et le
// log console du magic-link dans server/lib/{better-auth,mail}.ts : gardé strict uniquement en
// production, jamais élargi pour un chemin/cas particulier.
const MAX_REQUESTS = process.env.NODE_ENV === 'production' ? 120 : 10_000

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
