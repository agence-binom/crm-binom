<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const { data, refresh } = await useFetch(`/api/projects/${projectId.value}`)
const project = computed(() => data.value)

const isProjectModalOpen = ref(false)

const onDeleteProject = async (projectId: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

  try {
    await $fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    })
    await navigateTo('/projects')
  } catch (err) {
    console.error('Erreur lors de la suppression du projet:', err)
  }
}

const handleProjectChange = async () => {
  await refresh()
}
</script>

<template>
  <div
    v-if="project"
    class="container mx-auto p-6 overflow-scroll"
  >
    <ProjectHeader
      :project="project"
      @open-info="isProjectModalOpen = true"
      @delete="onDeleteProject"
    />
    <ProjectModal
      v-model:open="isProjectModalOpen"
      :project-id="project.id"
      :project="project"
      :client-id="project.clientId"
      @saved="handleProjectChange"
    />
  </div>
</template>
