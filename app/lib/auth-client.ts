import { createAuthClient } from 'better-auth/vue'
import { magicLinkClient } from 'better-auth/client/plugins'

// Pas de baseURL explicite : le catch-all server/api/auth/[...all].ts est monté sur /api/auth,
// exactement le chemin par défaut attendu par le client Better Auth (même origine).
export const authClient = createAuthClient({
  plugins: [magicLinkClient()]
})
