<script setup lang="ts">
import type { Project } from '~/types'

type ProjectHeaderClient = {
  id?: number | null
  name?: string | null
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
  archive: [projectId: number]
  restore: [projectId: number]
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
    <template
      v-if="client?.id && client?.name"
      #eyebrow
    >
      <NuxtLink
        :to="`/clients/${client.id}`"
        class="inline-flex w-fit items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-primary-600"
      >
        <UIcon name="i-lucide-building-2" />
        {{ client.name }}
      </NuxtLink>
    </template>

    <template #actions>
      <div class="flex items-center gap-2">
        <UButton
          size="sm"
          variant="soft"
          color="neutral"
          icon="i-lucide-edit"
          @click="emit('openInfo')"
        >
          Modifier les informations
        </UButton>
        <UButton
          v-if="!project.archived"
          size="sm"
          variant="ghost"
          color="neutral"
          icon="i-lucide-archive"
          aria-label="Archiver le projet"
          @click="emit('archive', project.id)"
        />
        <template v-else>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-lucide-archive-restore"
            aria-label="Restaurer le projet"
            @click="emit('restore', project.id)"
          />
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Supprimer le projet"
            @click="emit('delete', project.id)"
          />
        </template>
      </div>
    </template>
  </AppPageHeader>
</template>
