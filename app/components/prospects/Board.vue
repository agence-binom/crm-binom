<script setup lang="ts">
import { lostProspectStatus, prospectionBoardStatuses, type ProspectionStatus } from '~/constants/prospection'
import type { Client } from '~/types'

const props = defineProps<{
  clients: Client[]
}>()

const emit = defineEmits<{
  refresh: []
}>()
const { showError } = useFeedbackToast()

const isClientModalOpen = ref(false)
const selectedClientId = ref<number | null>(null)
const showLostProspects = ref(false)
// Après un déplacement, ne stocke pas que le statut mais le client complet renvoyé par l'API - un
// déplacement fait aussi bouger contactedAt/relancedAt/archived côté serveur (getProspectionStatusSideEffects),
// s'en tenir au seul statut affichait la carte dans la bonne colonne mais avec une date de contact/relance
// périmée tant que la page n'était pas rechargée.
const clientOverrides = ref(new Map<number, Partial<Client>>())

const visibleClients = computed(() => {
  return props.clients.map((client) => {
    const override = clientOverrides.value.get(client.id)

    if (!override) {
      return client
    }

    return { ...client, ...override }
  })
})

const selectedClient = computed<Client | null>(() => {
  if (!selectedClientId.value) return null
  return visibleClients.value.find(client => client.id === selectedClientId.value) ?? null
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
  return prospectionBoardStatuses.filter(status => status !== lostProspectStatus || showLostProspects.value)
})

const openCreateProspect = () => {
  selectedClientId.value = null
  isClientModalOpen.value = true
}

const openEditProspect = (clientId: number) => {
  selectedClientId.value = clientId
  isClientModalOpen.value = true
}

const handleProspectMoved = async (clientId: number, newStatus: ProspectionStatus) => {
  const previousOverride = clientOverrides.value.get(clientId)

  // Optimiste : bascule la carte dans la nouvelle colonne tout de suite, sans attendre la réponse.
  clientOverrides.value = new Map(clientOverrides.value).set(clientId, { prospectionStatus: newStatus })

  try {
    const { client: updatedClient } = await $fetch<{ client: Client }>(`/api/clients/${clientId}`, {
      method: 'PUT',
      body: { prospectionStatus: newStatus }
    })

    // Remplace la supposition optimiste par le client tel que renvoyé par le serveur, qui porte les
    // effets de bord réels (contactedAt/relancedAt/archived) - évite d'avoir à dupliquer cette logique
    // côté client ou à recharger la page pour les voir apparaître.
    clientOverrides.value = new Map(clientOverrides.value).set(clientId, updatedClient)
  } catch (error) {
    const nextOverrides = new Map(clientOverrides.value)
    if (previousOverride) {
      nextOverrides.set(clientId, previousOverride)
    } else {
      nextOverrides.delete(clientId)
    }
    clientOverrides.value = nextOverrides
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
    <div class="flex flex-wrap items-center justify-end gap-3 mb-6">
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

    <ClientsModal
      v-model:open="isClientModalOpen"
      :client-id="selectedClientId"
      :client="selectedClient"
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
          @edit-prospect="openEditProspect"
          @archive-prospect="(clientId) => handleProspectMoved(clientId, lostProspectStatus)"
        />
      </div>
    </div>
  </div>
</template>
