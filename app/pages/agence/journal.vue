<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { activityActionLabels, activityActionColors, activityEntityLabels } from '~/lib/activity-log'
import { formatDate } from '~/lib/utils'
import type { ActivityAction } from '~/validation/activity-log'

type ActivityLogEntry = {
  id: number
  entityType: string
  entityId: number
  action: ActivityAction
  actorType: 'user' | 'contact'
  actorName: string
  metadata: { name?: string | null } | null
  createdAt: string
}

const { data: session } = await useAppSession()
const isAdmin = computed(() => session.value?.user?.role === 'admin')

const { data, status, error, refresh } = await useFetch('/api/activity-log')
const entries = computed(() => (data.value?.entries ?? []) as ActivityLogEntry[])
const isLoading = computed(() => status.value === 'pending' && !data.value)

const columns: TableColumn<ActivityLogEntry>[] = [
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entityType', header: 'Élément' },
  { accessorKey: 'actorName', header: 'Auteur' }
]

const entityLabel = (entityType: string) =>
  (activityEntityLabels as Record<string, string>)[entityType] ?? entityType
</script>

<template>
  <div class="container mx-auto p-6">
    <AppListHeader
      title="Journal d'activité"
      level="h1"
      :bordered="false"
      :count="entries.length"
    />

    <div
      v-if="!isAdmin && status !== 'pending'"
      class="mt-6"
    >
      <AppEmptyState
        icon="i-lucide-lock"
        variant="bare"
        title="Accès réservé aux administrateurs"
      />
    </div>

    <div
      v-else-if="error"
      class="mt-6"
    >
      <AppEmptyState
        icon="i-lucide-alert-triangle"
        variant="bare"
        title="Impossible de charger le journal"
        description="Une erreur est survenue lors du chargement des activités."
      >
        <template #actions>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="soft"
            @click="refresh()"
          >
            Réessayer
          </UButton>
        </template>
      </AppEmptyState>
    </div>

    <div
      v-else
      class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <UTable
        :data="entries"
        :columns="columns"
        :loading="isLoading"
        sticky="header"
        :ui="{ base: 'table-fixed w-full' }"
        class="max-h-[calc(100vh-14rem)]"
      >
        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>

        <template #action-cell="{ row }">
          <UBadge
            :color="activityActionColors[row.original.action]"
            variant="soft"
          >
            {{ activityActionLabels[row.original.action] }}
          </UBadge>
        </template>

        <template #entityType-cell="{ row }">
          <div>
            <p class="truncate font-medium text-slate-900">
              {{ row.original.metadata?.name || `${entityLabel(row.original.entityType)} #${row.original.entityId}` }}
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              {{ entityLabel(row.original.entityType) }} #{{ row.original.entityId }}
            </p>
          </div>
        </template>

        <template #actorName-cell="{ row }">
          {{ row.original.actorName }}
        </template>

        <template #empty>
          <AppEmptyState
            icon="i-lucide-history"
            variant="bare"
            title="Aucune activité pour le moment"
          />
        </template>
      </UTable>
    </div>
  </div>
</template>
