<template>
  <div class="container mx-auto p-6">
    <!-- En-tête avec le nom du client -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">
        Projets de {{ data?.client.name }}
      </h1>
      <UBreadcrumb :items="breadcrumbItems" />
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center mb-6">
      <UButton
        icon="i-lucide-arrow-left"
        variant="soft"
        @click="navigateTo('/clients')"
      >
        Retour aux clients
      </UButton>
      <UButton
        icon="i-lucide-plus"
        @click="navigateTo(`/clients/${clientId}/projects/new`)"
      >
        Nouveau projet
      </UButton>
    </div>

    <!-- Liste des projets -->
    <UCard v-if="data && data.projects.length > 0">
      <div class="space-y-4">
        <div
          v-for="project in data.projects"
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
                <span v-if="project.budget">
                  <UIcon
                    name="i-lucide-euro"
                    class="inline"
                  />
                  {{ formatBudget(project.budget) }}
                </span>
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
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="soft"
                size="sm"
                @click="onDeleteProject(project.id)"
              >
                Supprimer
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Message si aucun projet -->
    <UCard v-else-if="data">
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-folder-open"
          class="text-4xl text-gray-400 mb-2"
        />
        <p class="text-gray-600">
          Aucun projet pour ce client
        </p>
        <UButton
          class="mt-4"
          @click="navigateTo(`/clients/${clientId}/projects/new`)"
        >
          Créer le premier projet
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const clientId = computed(() => Number(route.params.id))

const { data, refresh } = await useFetch(`/api/clients/${clientId.value}/projects`)

const breadcrumbItems = computed(() => [
  { label: 'Clients', to: '/clients' },
  { label: data.value?.client.name || '', to: `/clients/${clientId.value}` },
  { label: 'Projets' }
])

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

const formatBudget = (cents: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100)
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const onDeleteProject = async (projectId: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
    return
  }

  try {
    await $fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error)
  }
}
</script>
