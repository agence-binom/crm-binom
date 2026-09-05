import type { ProjectResource } from '~/types'

// Keyed per project (unlike usePortalProjects/usePortalSession's fixed keys) since the client can
// navigate between their projects without a full page reload - `watch` refetches when that happens.
export const usePortalProjectResources = (projectId: Ref<number>) => {
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  return useAsyncData<{ resources: ProjectResource[] }>(
    () => `portal-project-resources-${projectId.value}`,
    () => requestFetch(`/api/portal/projects/${projectId.value}/resources`),
    { watch: [projectId] }
  )
}
