<script setup lang="ts">
import { annotateDocumentLifecycle, type BillingDocumentType } from '~/lib/documents'
import type { BillingProjectStatus } from '~/lib/billing'
import { getProjectDisplayStatus } from '~/lib/projects'
import { formatDateOnly } from '~/lib/utils'
import type { ProjectDocument } from '~/types'

const props = defineProps<{
  open: boolean
  project: BillingProjectStatus | null
}>()

const { getStatusColor, getStatusLabel } = useStatusHelpers()

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
    side="right"
    class="w-full max-w-xl"
  >
    <template #title>
      <AppLink
        :to="`/clients/${project?.project.clientId}/projects/${project?.project.id}`"
        class="group min-w-48"
      >
        <span>{{ project?.project.name }}</span>
        <UBadge
          v-if="project"
          variant="soft"
          :color="getStatusColor(getProjectDisplayStatus(project.project))"
          class="rounded-full align-middle"
        >
          {{ getStatusLabel(getProjectDisplayStatus(project.project)) }}
        </UBadge>
      </AppLink>
    </template>
    <template #description>
      <div class="space-y-2">
        <NuxtLink
          :to="`/clients/${project?.project.client.id}`"
          class="inline-flex max-w-full items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
        >
          <UIcon
            name="i-lucide-building-2"
            class="shrink-0"
          />
          <span class="truncate">{{ project?.project.client.name }}</span>
        </NuxtLink>
        <p
          v-if="project?.project.startDate || project?.project.endDate"
          class="text-xs text-slate-400"
        >
          {{ formatDateOnly(project?.project.startDate) }} → {{ formatDateOnly(project?.project.endDate) }}
        </p>
      </div>
    </template>

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
