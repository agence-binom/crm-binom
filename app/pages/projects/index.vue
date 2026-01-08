<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">
        Tous les projets
      </h1>
    </div>

    <!-- Filtres par statut -->
    <div class="mb-6 flex gap-2">
      <UButton
        :variant="statusFilter === 'all' ? 'solid' : 'soft'"
        @click="statusFilter = 'all'"
      >
        Tous
      </UButton>
      <UButton
        :variant="statusFilter === 'en_cours' ? 'solid' : 'soft'"
        color="primary"
        @click="statusFilter = 'en_cours'"
      >
        En cours
      </UButton>
      <UButton
        :variant="statusFilter === 'termine' ? 'solid' : 'soft'"
        color="success"
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

    <UCard v-else>
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-folder-open"
          class="text-4xl text-gray-400 mb-2"
        />
        <p class="text-gray-600">
          Aucun projet {{ statusFilter !== 'all' ? 'avec ce statut' : '' }}
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { data } = await useFetch('/api/projects')
const projects = computed(() => data.value?.projects || [])

const statusFilter = ref('all')

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') {
    return projects.value
  }
  return projects.value.filter(p => p.status === statusFilter.value)
})
</script>
