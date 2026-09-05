<script setup lang="ts">
import { getErrorMessage } from '~/lib/utils'

definePageMeta({ layout: 'portal' })

const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const { data, status, error, refresh } = usePortalProjects()

const isLoading = computed(() => status.value === 'pending' && !data.value)
const project = computed(() => data.value?.projects.find(p => p.id === projectId.value) ?? null)
const isNotFound = computed(() => !isLoading.value && !error.value && !!data.value && !project.value)
</script>

<template>
  <div class="w-full px-4 py-8 sm:px-8 lg:px-16 lg:py-16">
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <USkeleton class="h-10 w-72" />
      <div class="space-y-8 pt-8">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-40"
        />
      </div>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Impossible de charger ce projet"
      :description="getErrorMessage(error, 'Merci de réessayer dans quelques instants.')"
    >
      <template #actions>
        <UButton
          color="error"
          variant="soft"
          @click="refresh()"
        >
          Réessayer
        </UButton>
      </template>
    </UAlert>

    <AppEmptyState
      v-else-if="isNotFound"
      icon="i-lucide-folder-x"
      size="lg"
      title="Projet introuvable"
      description="Ce projet n'existe pas ou n'est plus accessible."
    />

    <template v-else-if="project">
      <div class="flex flex-col gap-1 border-b border-slate-100 pb-8">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {{ project.name }}
        </h1>
      </div>

      <div class="flex flex-col gap-4 border-b border-slate-100 py-8">
        <h2 class="text-base font-semibold text-slate-900">
          Livrables
        </h2>
        <AppEmptyState
          icon="i-lucide-package"
          title="Aucun livrable pour le moment"
          description="Les maquettes et prototypes partagés par l'agence apparaîtront ici."
        />
      </div>

      <div class="flex flex-col gap-4 border-b border-slate-100 py-8">
        <h2 class="text-base font-semibold text-slate-900">
          Documents importants
        </h2>
        <AppEmptyState
          icon="i-lucide-file-text"
          title="Aucun document pour le moment"
          description="Votre proposition commerciale, votre devis et vos factures apparaîtront ici."
        />
      </div>

      <div class="flex flex-col gap-4 py-8">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900">
            Ressources
          </h2>
          <UButton
            icon="i-lucide-circle-plus"
            color="neutral"
            variant="soft"
            disabled
          >
            Nouvelle ressource
          </UButton>
        </div>
        <AppEmptyState
          icon="i-lucide-folder-open"
          title="Aucune ressource pour le moment"
          description="Les fichiers et ressources partagés par l'agence apparaîtront ici."
        />
      </div>
    </template>
  </div>
</template>
