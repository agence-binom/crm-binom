<script setup lang="ts">
import { annotateDocumentLifecycle, type BillingDocumentType } from '~/lib/documents'
import type { BillingProjectStatus } from '~/lib/billing'
import type { ProjectDocument } from '~/types'

const props = defineProps<{
  open: boolean
  project: BillingProjectStatus | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const documents = ref<ProjectDocument[]>([])
const isLoading = ref(false)

const loadDocuments = async () => {
  const projectId = props.project?.project.id
  if (!projectId) return

  isLoading.value = true
  try {
    const response = await $fetch<{ documents: ProjectDocument[] }>(`/api/documents/project/${projectId}`)
    documents.value = response.documents
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.open, props.project?.project.id] as const,
  ([open]) => {
    if (open) loadDocuments()
  },
  { immediate: true }
)

const isBillingDocumentType = (documentType?: string | null): documentType is BillingDocumentType =>
  documentType === 'quote' || documentType === 'invoice' || documentType === 'commercial_proposal'

const annotatedDocuments = computed(() => annotateDocumentLifecycle(
  documents.value
    .filter(document => isBillingDocumentType(document.documentType))
    .map(document => ({ ...document, type: document.documentType as BillingDocumentType }))
))

const handleDocumentsChange = () => {
  loadDocuments()
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="project?.project.name"
    :description="project?.project.client.name"
    side="right"
    class="w-full max-w-xl"
  >
    <template #body>
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-12 text-sm text-slate-500"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="mr-2 animate-spin"
        />
        Chargement des documents...
      </div>

      <BillingVerticalTimeline
        v-else
        :documents="annotatedDocuments"
        @delete-document="handleDocumentsChange"
        @update-document="handleDocumentsChange"
      />
    </template>
  </USlideover>
</template>
