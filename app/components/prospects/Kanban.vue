<script setup lang="ts">
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import type { ProspectionStatus } from '~/constants/prospection'
import { getProspectionStatusClass, getProspectionStatusIcon, getProspectionStatusLabel } from '~/lib/prospection'
import type { Client } from '~/types'

const props = withDefaults(defineProps<{
  status: ProspectionStatus
  clients?: Client[]
}>(), {
  clients: () => []
})

const emit = defineEmits<{
  prospectMoved: [clientId: number, newStatus: ProspectionStatus]
}>()

// Fond de colonne et couleur sémantique du badge (pilotés ici, spécifiques au tableau) - la teinte
// réelle du badge et l'icône viennent de lib/prospection.ts pour rester identiques partout où un
// statut de prospection est affiché, et pour porter une palette propre à la prospection plutôt que
// celle, sans rapport, du kanban des tâches (lib/tasks.ts).
const columnSettings: Record<ProspectionStatus, {
  bgClass: string
  badgeColor: 'neutral' | 'primary' | 'warning' | 'success' | 'error'
  emptyIconClass: string
}> = {
  nouveau: {
    bgClass: 'bg-slate-50/90 ring-1 ring-slate-200/80',
    badgeColor: 'neutral',
    emptyIconClass: 'text-slate-300'
  },
  contacte: {
    bgClass: 'bg-teal-50/90 ring-1 ring-teal-200/80',
    badgeColor: 'primary',
    emptyIconClass: 'text-teal-300'
  },
  a_relancer: {
    bgClass: 'bg-orange-50/90 ring-1 ring-orange-200/80',
    badgeColor: 'warning',
    emptyIconClass: 'text-orange-300'
  },
  proposition_envoye: {
    bgClass: 'bg-indigo-50/90 ring-1 ring-indigo-200/80',
    badgeColor: 'primary',
    emptyIconClass: 'text-indigo-300'
  },
  negociation: {
    bgClass: 'bg-pink-50/90 ring-1 ring-pink-200/80',
    badgeColor: 'primary',
    emptyIconClass: 'text-pink-300'
  },
  client: {
    bgClass: 'bg-emerald-50/90 ring-1 ring-emerald-200/80',
    badgeColor: 'success',
    emptyIconClass: 'text-emerald-300'
  },
  perdu: {
    bgClass: 'bg-rose-50/90 ring-1 ring-rose-200/80',
    badgeColor: 'error',
    emptyIconClass: 'text-rose-300'
  }
}

const { bgClass, badgeColor, emptyIconClass } = columnSettings[props.status]
const label = getProspectionStatusLabel(props.status)
const badgeIcon = getProspectionStatusIcon(props.status)
const badgeClass = `${getProspectionStatusClass(props.status)} ring-1 ring-inset`

const [parent, clientList] = useDragAndDrop<Client>(props.clients, {
  group: 'kanban-prospects',
  dragHandle: '.kanban-handle',
  draggable: (el) => {
    return !el.hasAttribute('data-no-drag')
  },
  onDragstart: () => {
    document.querySelectorAll('[data-status]').forEach((zone) => {
      zone.setAttribute('data-drop-zone-active', 'true')
    })
  },
  onDragend: (data) => {
    document.querySelectorAll('[data-status]').forEach((zone) => {
      zone.removeAttribute('data-drop-zone-active')
    })

    const draggedClient = data.draggedNode.data.value as Client
    const targetParent = data.parent.el as HTMLElement
    const targetStatus = targetParent.dataset.status as ProspectionStatus

    if (draggedClient && targetStatus && draggedClient.prospectionStatus !== targetStatus) {
      emit('prospectMoved', draggedClient.id, targetStatus)
    }
  }
})

watch(() => props.clients, (newClients) => {
  clientList.value = [...newClients]
})
</script>

<template>
  <div :class="['h-full min-w-88 w-88 flex flex-col gap-4 rounded-[1.5rem] p-4 overflow-hidden shadow-sm backdrop-blur-sm', bgClass]">
    <div class="w-full flex justify-between items-center shrink-0">
      <UBadge
        variant="soft"
        :color="badgeColor"
        :icon="badgeIcon"
        size="md"
        :class="['rounded-full px-3.5 py-1.5 font-semibold', badgeClass]"
      >
        {{ label }}
      </UBadge>

      <span class="text-sm text-gray-500 font-medium tracking-tight">
        {{ clientList.length }} dossier{{ clientList.length > 1 ? 's' : '' }}
      </span>
    </div>

    <div
      ref="parent"
      :data-status="props.status"
      class="w-full flex-1 flex flex-col items-stretch gap-4 overflow-y-auto pr-1 scrollbar-custom pt-1 rounded-2xl transition-all duration-300 min-h-0"
    >
      <template v-if="clientList.length > 0">
        <ProspectsCard
          v-for="client in clientList"
          :key="client.id"
          :client="client"
        />
      </template>
      <div
        v-else
        class="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/70 bg-white/50 px-6 text-center"
      >
        <UIcon
          :name="badgeIcon"
          :class="['mb-3 text-3xl', emptyIconClass]"
        />
        <p class="text-sm font-medium text-gray-500">
          Aucun dossier {{ label.toLowerCase() }}
        </p>
        <p class="mt-1 text-xs text-gray-400">
          Déplace un dossier ici ou crée-en un nouveau.
        </p>
      </div>
    </div>
  </div>
</template>
