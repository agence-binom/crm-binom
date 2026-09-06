<script setup lang="ts">
import { getErrorMessage } from '~/lib/utils'

definePageMeta({ layout: 'portal' })

// Pas de "vue d'ensemble" séparée : le portail navigue directement au premier projet du client
// (voir app/layouts/portal.vue pour la liste complète dans l'aside).
const { data, error, refresh } = await usePortalProjects()

if (data.value?.projects.length) {
  await navigateTo(`/espace-client/projets/${data.value.projects[0]!.id}`, { replace: true })
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:px-16 lg:py-16">
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Impossible de charger votre espace client"
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
      v-else
      icon="i-lucide-folder-open"
      size="lg"
      title="Aucun projet pour le moment"
      description="Vos projets apparaîtront ici dès qu'ils seront disponibles."
    />
  </div>
</template>
