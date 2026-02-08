<script setup lang="ts">
import type { Project } from '~/validation/projects'

const _props = defineProps<{
  projects: Project[]
  clientId: number
}>()

const emit = defineEmits<{
  create: []
  delete: [projectId: number]
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
    @delete="(id) => emit('delete', id)"
  />
</template>
