import type { BillingDocumentRecord } from '~/types'

// Same per-project keying/refetch strategy as usePortalProjectResources.
export const usePortalProjectBillingDocuments = (projectId: Ref<number>) => {
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  return useAsyncData<{ documents: BillingDocumentRecord[] }>(
    () => `portal-project-billing-documents-${projectId.value}`,
    () => requestFetch(`/api/portal/projects/${projectId.value}/billing-documents`),
    { watch: [projectId] }
  )
}
