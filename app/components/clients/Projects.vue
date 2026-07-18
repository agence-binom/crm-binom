<script setup lang="ts">
import type { Project } from '~/types'

const _props = defineProps<{
  projects: Project[]
  clientId: number
}>()

const emit = defineEmits<{
  create: []
  delete: [projectId: number]
  edit: [projectId: number]
  archive: [projectId: number]
  restore: [projectId: number]
}>()
</script>

<template>
  <ProjectsList
    :projects="projects"
    :client-id="clientId"
    :show-header="true"
    :show-create-button="true"
    :show-delete-button="true"
    empty-message="Aucun projet pour ce client"
    @create="emit('create')"
    @edit="(id) => emit('edit', id)"
    @delete="(id) => emit('delete', id)"
    @archive="(id) => emit('archive', id)"
    @restore="(id) => emit('restore', id)"
  />
</template>
