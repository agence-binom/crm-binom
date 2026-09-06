<script setup lang="ts">
import { sortByCreatedAtDesc } from '~/lib/utils'
import type { ProjectDeliverable } from '~/types'

const props = defineProps<{
  deliverables: ProjectDeliverable[]
}>()

const sortedDeliverables = computed(() => sortByCreatedAtDesc(props.deliverables))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="sortedDeliverables.length"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <DeliverablesCard
        v-for="deliverable in sortedDeliverables"
        :key="deliverable.id"
        :deliverable="deliverable"
        readonly
      />
    </div>

    <AppEmptyState
      v-else
      icon="i-lucide-package"
      title="Aucun livrable pour le moment"
      description="Les maquettes et prototypes partagés par l'agence apparaîtront ici."
    />
  </div>
</template>
