type PortalProject = {
  id: number
  name: string
  status: string
}

// Même pattern que usePortalSession : clé fixe partagée par le layout (aside) et la page projet,
// requestFetch côté serveur pour transmettre le cookie de session (sinon 401 pendant le SSR).
export const usePortalProjects = () => {
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  return useAsyncData<{ projects: PortalProject[] }>(
    'portal-projects',
    () => requestFetch('/api/portal/projects')
  )
}
