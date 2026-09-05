type PortalSession = {
  contact: {
    firstName: string
    lastName: string
    portalLastLoginAt: string | null
  }
  client: {
    name: string
  }
}

// Clé fixe : le layout portail et chaque page de /espace-client partagent le même fetch
// (dédupliqué par Nuxt) au lieu de recharger la session à chaque navigation.
// Côté serveur, $fetch ne transmet pas le cookie de session de la requête entrante : il faut
// useRequestFetch() (même pattern que app/middleware/auth.global.ts), sous peine de 401.
export const usePortalSession = () => {
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  return useAsyncData<PortalSession>('portal-session', () => requestFetch('/api/portal/session'))
}
