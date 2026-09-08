type AppSession = {
  user: {
    id: number
    role: string
    email: string
  }
}

// Clé fixe : le layout agence et chaque page (ex. /agence/journal) partagent le même fetch
// (dédupliqué par Nuxt) au lieu de recharger la session à chaque navigation - même principe
// que usePortalSession côté espace client. `dedupe: 'defer'` pour qu'un second appel concurrent
// (layout + page montés avant que le premier fetch ne résolve) attende la requête déjà en vol
// plutôt que de l'annuler pour en relancer une identique.
export const useAppSession = () => useFetch<AppSession>('/api/auth/session', { key: 'app-session', dedupe: 'defer' })
