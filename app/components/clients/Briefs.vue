<script setup lang="ts">
import { formatDateOnly } from '~/lib/utils'
import { getBriefProjectTypeLabel } from '~/lib/briefs'
import type { BriefListItem, Contact, Project } from '~/types'

const props = defineProps<{
  clientId: number
  contacts: Contact[]
  projects: Project[]
}>()

// Une création ou un rattachement change le badge brief des cartes projet : la fiche recharge.
const emit = defineEmits<{
  changed: []
}>()

const { data, refresh } = useFetch<{ briefs: BriefListItem[] }>(() => `/api/clients/${props.clientId}/briefs`, {
  key: `client-briefs-${props.clientId}`
})
const pendingBriefs = computed(() => (data.value?.briefs ?? []).filter(brief => brief.status !== 'completed'))
const briefsToAttach = computed(() => (data.value?.briefs ?? []).filter(brief => brief.status === 'completed' && !brief.projectId))
const attachableProjects = computed(() => props.projects
  .filter(project => !project.brief && !project.archived)
  .map(project => ({ value: String(project.id), label: project.name })))

const { showError, showSuccess } = useFeedbackToast()
const { copy } = useCopyToClipboard()

const isCreateModalOpen = ref(false)
const pendingDeleteId = ref<number | null>(null)
const pendingRegenerateId = ref<number | null>(null)
const attachSelection = ref<Record<number, string>>({})

const refreshAll = async () => {
  await refresh()
  emit('changed')
}

const regenerate = async () => {
  const id = pendingRegenerateId.value
  pendingRegenerateId.value = null
  if (!id) return

  try {
    const brief = await $fetch<BriefListItem>(`/api/briefs/${id}/regenerate`, { method: 'POST', body: {} })
    await refresh()
    await copy(brief.url, 'Nouveau lien copié : l’ancien ne fonctionne plus.')
  } catch (error) {
    showError('Régénération impossible', error, 'Le lien n’a pas pu être régénéré.')
  }
}

const deleteBrief = async () => {
  const id = pendingDeleteId.value
  pendingDeleteId.value = null
  if (!id) return

  try {
    await $fetch(`/api/briefs/${id}`, { method: 'DELETE' })
    await refreshAll()
    showSuccess('Brief supprimé', 'Le brief et ses réponses ont été supprimés.')
  } catch (error) {
    showError('Suppression impossible', error, 'Le brief n’a pas pu être supprimé.')
  }
}

const attach = async (briefId: number) => {
  const projectId = Number(attachSelection.value[briefId])
  if (!projectId) return

  try {
    await $fetch(`/api/briefs/${briefId}`, { method: 'PATCH', body: { projectId } })
    await refreshAll()
    showSuccess('Brief rattaché', 'Le brief s’affiche désormais sur la fiche du projet.')
  } catch (error) {
    showError('Rattachement impossible', error, 'Le brief n’a pas pu être rattaché à ce projet.')
  }
}

const describeTarget = (brief: BriefListItem) => (
  brief.projectName ? `Pour le projet « ${brief.projectName} »` : 'Pour un nouveau projet, créé à réception'
)

const describeTiming = (brief: BriefListItem) => {
  if (brief.displayStatus === 'expired') return `Expiré le ${formatDateOnly(brief.expiresAt)}`
  if (brief.openedAt) return `Ouvert le ${formatDateOnly(brief.openedAt)} · expire le ${formatDateOnly(brief.expiresAt)}`
  return `Envoyé le ${formatDateOnly(brief.createdAt)} · expire le ${formatDateOnly(brief.expiresAt)}`
}
</script>

<template>
  <div class="space-y-6">
    <AppListHeader
      title="Briefs en attente"
      icon="i-lucide-clipboard-list"
      :count="pendingBriefs.length"
    >
      <template #actions>
        <UButton
          icon="i-lucide-send"
          variant="soft"
          color="neutral"
          @click="isCreateModalOpen = true"
        >
          Envoyer le brief
        </UButton>
      </template>
    </AppListHeader>

    <div
      v-if="briefsToAttach.length > 0"
      class="space-y-3"
    >
      <UAlert
        v-for="brief in briefsToAttach"
        :key="brief.id"
        color="warning"
        variant="subtle"
        icon="i-lucide-link-2-off"
        title="Brief à rattacher à un projet"
        :description="`Reçu le ${formatDateOnly(brief.completedAt)}${brief.projectType ? ` (${getBriefProjectTypeLabel(brief.projectType)})` : ''}, avant que les briefs ne soient rattachés aux projets. Choisissez le projet qu’il concerne.`"
      >
        <template #actions>
          <USelect
            v-model="attachSelection[brief.id]"
            :items="attachableProjects"
            value-attribute="value"
            option-attribute="label"
            placeholder="Projet"
            class="w-56"
            :aria-label="`Projet du brief reçu le ${formatDateOnly(brief.completedAt)}`"
          />
          <UButton
            size="sm"
            :disabled="!attachSelection[brief.id]"
            @click="attach(brief.id)"
          >
            Rattacher
          </UButton>
        </template>
      </UAlert>
    </div>

    <ul
      v-if="pendingBriefs.length > 0"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="brief in pendingBriefs"
        :key="brief.id"
      >
        <AppCard
          :title="describeTarget(brief)"
          :subtitle="describeTiming(brief)"
        >
          <template #badge>
            <BriefsStatusBadge :status="brief.displayStatus" />
          </template>

          <UBadge
            v-if="brief.contactName"
            variant="soft"
            color="neutral"
            icon="i-lucide-user"
            class="rounded-full"
          >
            {{ brief.contactName }}
          </UBadge>

          <div class="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
            <UButton
              v-if="brief.displayStatus !== 'expired'"
              size="sm"
              variant="soft"
              icon="i-lucide-copy"
              @click="copy(brief.url)"
            >
              Copier le lien
            </UButton>
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-lucide-refresh-cw"
              @click="pendingRegenerateId = brief.id"
            >
              Régénérer
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              aria-label="Supprimer le brief"
              @click="pendingDeleteId = brief.id"
            />
          </div>
        </AppCard>
      </li>
    </ul>

    <AppEmptyState
      v-else
      variant="compact"
      icon="i-lucide-clipboard-list"
      title="Aucun brief en attente"
      description="Les briefs complétés s’affichent sur la fiche de leur projet."
    />

    <BriefsCreateModal
      v-model:open="isCreateModalOpen"
      :client-id="clientId"
      :contacts="contacts"
      :projects="projects"
      @created="refreshAll"
    />

    <ConfirmModal
      :open="pendingRegenerateId !== null"
      title="Régénérer le lien"
      message="Un nouveau lien sera créé avec une nouvelle date d’expiration. L’ancien lien cessera immédiatement de fonctionner."
      @confirm="regenerate"
      @cancel="pendingRegenerateId = null"
    />

    <ConfirmModal
      :open="pendingDeleteId !== null"
      title="Supprimer le brief"
      message="Le brief et toutes les réponses du prospect seront définitivement supprimés."
      @confirm="deleteBrief"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
