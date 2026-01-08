<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
      <h1 class="text-3xl font-bold">
        Tous les projets
      </h1>
      <UButton
        icon="i-lucide-circle-plus"
        variant="outline"
        color="neutral"
        @click="openCreateProject"
      >
        Nouveau projet
      </UButton>
    </div>

    <ProjectModal
      v-model:open="isProjectModalOpen"
      :client-id="0"
      @saved="handleProjectChange"
    />

    <!-- Filtres par statut -->
    <div class="mb-6 flex flex-wrap gap-2">
      <UButton
        :variant="statusFilter === 'all' ? 'solid' : 'soft'"
        color="neutral"
        class="transition-all duration-200"
        @click="statusFilter = 'all'"
      >
        Tous
      </UButton>
      <UButton
        :variant="statusFilter === 'en_cours' ? 'solid' : 'soft'"
        color="info"
        class="transition-all duration-200"
        @click="statusFilter = 'en_cours'"
      >
        En cours
      </UButton>
      <UButton
        :variant="statusFilter === 'termine' ? 'solid' : 'soft'"
        color="success"
        class="transition-all duration-200"
        @click="statusFilter = 'termine'"
      >
        Terminés
      </UButton>
      <UButton
        :variant="statusFilter === 'en_attente' ? 'solid' : 'soft'"
        color="warning"
        @click="statusFilter = 'en_attente'"
      >
        En attente
      </UButton>
      <UButton
        :variant="statusFilter === 'annule' ? 'solid' : 'soft'"
        color="error"
        @click="statusFilter = 'annule'"
      >
        Annulés
      </UButton>
    </div>

    <!-- Liste des projets -->
    <ProjectsList
      v-if="filteredProjects && filteredProjects.length > 0"
      :projects="filteredProjects"
      :show-header="false"
      :show-create-button="false"
      :show-delete-button="false"
    />

    <div
      v-else
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="text-4xl text-gray-400 mb-2"
      />
      <p class="text-gray-600">
        Aucun projet {{ statusFilter !== 'all' ? 'avec ce statut' : '' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data, refresh } = await useFetch('/api/projects')
const projects = computed(() => data.value?.projects || [])

const statusFilter = ref('all')
const isProjectModalOpen = ref(false)

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') {
    return projects.value
  }
  return projects.value.filter(p => p.status === statusFilter.value)
})

const openCreateProject = () => {
  isProjectModalOpen.value = true
}

const handleProjectChange = async () => {
  await refresh()
}
</script>
