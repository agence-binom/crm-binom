<script setup lang="ts">
import { prospectionBoardStatuses, type ProspectionStatus } from '~/constants/prospection'
import type { Client } from '~/types'

const props = defineProps<{
  clients: Client[]
}>()

const emit = defineEmits<{
  refresh: []
}>()
const { showError } = useFeedbackToast()

const isClientModalOpen = ref(false)
const showLostProspects = ref(false)
const prospectionStatusOverrides = ref(new Map<number, ProspectionStatus>())

const visibleClients = computed(() => {
  return props.clients.map((client) => {
    const statusOverride = prospectionStatusOverrides.value.get(client.id)

    if (!statusOverride) {
      return client
    }

    return { ...client, prospectionStatus: statusOverride }
  })
})

const clientsByStatus = computed<Record<ProspectionStatus, Client[]>>(() => {
  const grouped = new Map<ProspectionStatus, Client[]>(prospectionBoardStatuses.map(status => [status, []]))

  for (const client of visibleClients.value) {
    grouped.get(client.prospectionStatus ?? 'nouveau')?.push(client)
  }

  for (const clients of grouped.values()) {
    clients.sort((a, b) => a.name.localeCompare(b.name))
  }

  return Object.fromEntries(grouped) as Record<ProspectionStatus, Client[]>
})

const displayedStatuses = computed<ProspectionStatus[]>(() => {
  return prospectionBoardStatuses.filter(status => status !== 'perdu' || showLostProspects.value)
})

const openCreateProspect = () => {
  isClientModalOpen.value = true
}

const handleProspectMoved = async (clientId: number, newStatus: ProspectionStatus) => {
  const client = visibleClients.value.find(currentClient => currentClient.id === clientId)
  const previousStatus = client?.prospectionStatus ?? 'nouveau'

  prospectionStatusOverrides.value = new Map(prospectionStatusOverrides.value).set(clientId, newStatus)

  try {
    await $fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      body: { prospectionStatus: newStatus }
    })
  } catch (error) {
    const nextOverrides = new Map(prospectionStatusOverrides.value)
    nextOverrides.set(clientId, previousStatus)
    prospectionStatusOverrides.value = nextOverrides
    console.error('Erreur lors du déplacement du prospect:', error)
    showError('Déplacement impossible', error, 'Impossible de déplacer le prospect.')
  }
}

const handleProspectSaved = () => {
  emit('refresh')
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h2 class="text-xl font-semibold">
        Prospection
      </h2>

      <div class="flex flex-wrap items-center gap-3">
        <UButton
          :icon="showLostProspects ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          variant="outline"
          color="neutral"
          @click="showLostProspects = !showLostProspects"
        >
          {{ showLostProspects ? 'Masquer les dossiers perdus' : 'Afficher les dossiers perdus' }}
        </UButton>

        <UButton
          icon="i-lucide-circle-plus"
          variant="outline"
          color="neutral"
          @click="openCreateProspect"
        >
          Nouveau prospect
        </UButton>
      </div>
    </div>

    <ClientsModal
      v-model:open="isClientModalOpen"
      @saved="handleProspectSaved"
    />

    <div class="overflow-x-auto p-1 pb-3 scrollbar-custom">
      <div class="flex min-w-max gap-6 h-[calc(100vh-10rem)] min-h-150">
        <ProspectsKanban
          v-for="status in displayedStatuses"
          :key="status"
          :status="status"
          :clients="clientsByStatus[status]"
          @prospect-moved="handleProspectMoved"
        />
      </div>
    </div>
  </div>
</template>
