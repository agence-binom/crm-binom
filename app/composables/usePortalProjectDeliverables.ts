import type { ProjectDeliverable } from '~/types'

// Keyed per project (unlike usePortalProjects/usePortalSession's fixed keys) since the client can
// navigate between their projects without a full page reload - `watch` refetches when that happens.
export const usePortalProjectDeliverables = (projectId: Ref<number>) => {
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  return useAsyncData<{ deliverables: ProjectDeliverable[] }>(
    () => `portal-project-deliverables-${projectId.value}`,
    () => requestFetch(`/api/portal/projects/${projectId.value}/deliverables`),
    { watch: [projectId] }
  )
}
