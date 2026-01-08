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
    <UCard v-if="filteredProjects && filteredProjects.length > 0">
      <div class="space-y-4">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-xl font-semibold">
                  {{ project.name }}
                </h3>
                <UBadge :color="getStatusColor(project.status)">
                  {{ getStatusLabel(project.status) }}
                </UBadge>
              </div>

              <p
                v-if="project.description"
                class="text-gray-600 dark:text-gray-400 mb-2"
              >
                {{ project.description }}
              </p>

              <div class="flex gap-4 text-sm text-gray-500">
                <span v-if="project.startDate">
                  <UIcon
                    name="i-lucide-calendar"
                    class="inline"
                  />
                  Début: {{ formatDate(project.startDate) }}
                </span>
                <span v-if="project.endDate">
                  <UIcon
                    name="i-lucide-calendar-check"
                    class="inline"
                  />
                  Fin: {{ formatDate(project.endDate) }}
                </span>
              </div>

              <a
                v-if="project.url"
                :href="project.url"
                target="_blank"
                class="text-blue-600 hover:underline text-sm mt-2 inline-flex items-center gap-1"
              >
                <UIcon name="i-lucide-external-link" />
                Voir le site
              </a>
            </div>

            <div class="flex gap-2">
              <UButton
                icon="i-lucide-list-checks"
                variant="soft"
                size="sm"
                @click="navigateTo(`/projects/${project.id}/tasks`)"
              >
                Tâches
              </UButton>
              <UButton
                icon="i-lucide-pencil"
                variant="soft"
                size="sm"
                @click="navigateTo(`/projects/${project.id}/edit`)"
              >
                Modifier
              </UButton>
              <p class="text-gray-600">
                Aucun projet {{ statusFilter !== 'all' ? 'avec ce statut' : '' }}
              </p>
            </div>
          </div>
        </div>
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'en_cours': return 'primary'
    case 'termine': return 'success'
    case 'en_attente': return 'warning'
    case 'annule': return 'error'
    default: return 'neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'en_cours': return 'En cours'
    case 'termine': return 'Terminé'
    case 'en_attente': return 'En attente'
    case 'annule': return 'Annulé'
    default: return status
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}
</script>
