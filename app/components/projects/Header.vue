<script setup lang="ts">
import type { Project } from '~/types'

type ProjectHeaderClient = {
  email?: string | null
  phone?: string | null
  website?: string | null
}

const props = defineProps<{
  project: Project
  client?: ProjectHeaderClient | null
}>()

const emit = defineEmits<{
  openInfo: []
  delete: [projectId: number]
}>()

const infos = computed(() => [
  { value: props.client?.email, icon: 'i-lucide-mail' },
  { value: props.client?.phone, icon: 'i-lucide-phone' },
  { value: props.client?.website, icon: 'i-lucide-globe' }
])
</script>

<template>
  <AppPageHeader
    :title="project.name"
    :subtitle="project.description"
    :infos="infos"
  >
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton
          size="sm"
          variant="soft"
          color="neutral"
          icon="i-lucide-info"
          @click="emit('openInfo')"
        >
          Informations
        </UButton>
        <UButton
          size="sm"
          variant="ghost"
          color="error"
          icon="i-lucide-trash"
          aria-label="Supprimer le projet"
          @click="emit('delete', project.id)"
        />
      </div>
    </template>
  </AppPageHeader>
</template>
