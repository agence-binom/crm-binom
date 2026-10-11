<script setup lang="ts">
import { getBriefAlerts, type BriefAlertLevel } from '~/lib/brief-alerts'
import { getBriefProjectDiscrepancies } from '~/lib/brief-project'
import {
  describeBriefKeyField,
  formatBriefAnswerValue,
  getBriefAccessAvailabilityLabel,
  getBriefBudgetRangeLabel,
  getBriefProjectTypeLabel,
  getBriefSiteManagerLabel,
  groupBriefAnswersBySection,
  type BriefKeyFieldDisplay
} from '~/lib/briefs'
import { formatDate, formatDateOnly } from '~/lib/utils'
import type { Brief, Contact, Project } from '~/types'

const props = defineProps<{
  project: Pick<Project, 'id' | 'clientId' | 'name' | 'url' | 'endDate' | 'brief'>
}>()

// 404 = projet sans brief, cas normal (le brief est facultatif) : on l'affiche comme tel.
const { data: brief, refresh } = await useFetch<Brief>(() => `/api/projects/${props.project.id}/brief`, {
  key: `project-brief-${props.project.id}`
})
const { showError } = useFeedbackToast()
const { copy } = useCopyToClipboard()

const isCreateModalOpen = ref(false)
// Les contacts ne servent qu'à la modale d'envoi : chargés à la demande.
const { data: clientDashboard, execute: loadClientDashboard } = useFetch<{ contacts: Contact[] }>(
  () => `/api/clients/${props.project.clientId}/dashboard`,
  { immediate: false, server: false }
)
const openCreateModal = async () => {
  if (!clientDashboard.value) await loadClientDashboard()
  isCreateModalOpen.value = true
}

const appliedFieldLabels: Record<string, string> = {
  description: 'Description',
  url: 'URL du projet',
  endDate: 'Date de fin',
  notes: 'Notes'
}

// L'analyse du domaine tourne en arrière-plan juste après la réception : si on ouvre la page à ce
// moment-là, on recharge quelques fois plutôt que d'afficher « en cours » indéfiniment.
const ENRICHMENT_POLL_MS = 3000
const ENRICHMENT_MAX_POLLS = 10
let enrichmentPolls = 0
let enrichmentPollTimer: ReturnType<typeof setInterval> | undefined

const stopEnrichmentPolling = () => {
  clearInterval(enrichmentPollTimer)
  enrichmentPollTimer = undefined
}

onMounted(() => {
  watch(() => brief.value?.enrichmentStatus, (status) => {
    if (status !== 'pending') return stopEnrichmentPolling()
    if (enrichmentPollTimer) return
    enrichmentPollTimer = setInterval(async () => {
      if (enrichmentPolls >= ENRICHMENT_MAX_POLLS) return stopEnrichmentPolling()
      enrichmentPolls++
      await refresh()
    }, ENRICHMENT_POLL_MS)
  }, { immediate: true })
})

onBeforeUnmount(stopEnrichmentPolling)

const summary = computed(() => brief.value?.summary ?? {})
const enrichment = computed(() => brief.value?.enrichment ?? null)
const alerts = computed(() => (brief.value
  ? [
      ...getBriefProjectDiscrepancies(brief.value, props.project),
      ...getBriefAlerts({ summary: brief.value.summary, enrichment: brief.value.enrichment })
    ]
  : []))
const sections = computed(() => groupBriefAnswersBySection(brief.value?.answers ?? []))

const asList = (value: string[]) => value.join(', ')
const asYesNo = (value: boolean) => (value ? 'Oui' : 'Non')

type Fact = { label: string, icon: string, display: BriefKeyFieldDisplay }

const keyFacts = computed<Fact[]>(() => [
  { label: 'Type de projet', icon: 'i-lucide-layout-template', display: describeBriefKeyField(summary.value.projectType, getBriefProjectTypeLabel) },
  { label: 'Budget', icon: 'i-lucide-wallet', display: describeBriefKeyField(summary.value.budgetRange, getBriefBudgetRangeLabel) },
  { label: 'Échéance', icon: 'i-lucide-calendar-clock', display: describeBriefKeyField(summary.value.deadline, value => formatDateOnly(value)) },
  { label: 'Décideur', icon: 'i-lucide-user-check', display: describeBriefKeyField(summary.value.decisionMaker) }
])

const declaredFacts = computed<Fact[]>(() => [
  { label: 'Site actuel', icon: 'i-lucide-globe', display: describeBriefKeyField(summary.value.currentWebsite) },
  { label: 'Domaine acheté chez', icon: 'i-lucide-at-sign', display: describeBriefKeyField(summary.value.domainRegistrar) },
  { label: 'Gestion du site', icon: 'i-lucide-wrench', display: describeBriefKeyField(summary.value.siteManager, getBriefSiteManagerLabel) },
  { label: 'Prestataire informé', icon: 'i-lucide-message-square-share', display: describeBriefKeyField(summary.value.providerInformed, asYesNo) },
  { label: 'Accès', icon: 'i-lucide-key-round', display: describeBriefKeyField(summary.value.accessAvailability, getBriefAccessAvailabilityLabel) },
  { label: 'Emails sur le domaine', icon: 'i-lucide-mail', display: describeBriefKeyField(summary.value.domainEmails, asYesNo) },
  { label: 'Emails gérés chez', icon: 'i-lucide-inbox', display: describeBriefKeyField(summary.value.emailProvider) },
  { label: 'Outils à connecter', icon: 'i-lucide-plug', display: describeBriefKeyField(summary.value.toolsToConnect, asList) }
])

const goalsDisplay = computed(() => describeBriefKeyField(summary.value.goals, asList))
const deadlineContextDisplay = computed(() => describeBriefKeyField(summary.value.deadlineContext))

const detectedFacts = computed(() => {
  const data = enrichment.value
  if (!data) return []
  return [
    { label: 'Domaine analysé', value: data.domain || null },
    { label: 'Bureau d’enregistrement', value: data.registrar },
    { label: 'Serveurs DNS', value: data.nameServers?.join(', ') },
    { label: 'Hébergement probable', value: data.hosting },
    { label: 'Service email', value: data.emailProvider ?? (data.mxHosts?.length ? 'Non identifié' : 'Aucun MX') },
    { label: 'Serveurs MX', value: data.mxHosts?.join(', ') },
    { label: 'Technologies', value: data.technologies?.join(', ') },
    { label: 'Adresses IP', value: data.ipAddresses?.join(', ') }
  ]
})

const factClass = (display: BriefKeyFieldDisplay) => {
  if (display.state === 'unknown') return 'text-amber-700'
  if (display.state === 'missing') return 'text-slate-400'
  return 'text-slate-900'
}

const alertIcon = (level: BriefAlertLevel) => (level === 'info' ? 'i-lucide-info' : 'i-lucide-triangle-alert')

const isEnriching = ref(false)
const relaunchEnrichment = async () => {
  isEnriching.value = true
  try {
    if (!brief.value) return
    brief.value = await $fetch<Brief>(`/api/briefs/${brief.value.id}/enrich`, { method: 'POST' })
  } catch (enrichError) {
    showError('Analyse impossible', enrichError, 'L’analyse du domaine n’a pas pu être relancée.')
  } finally {
    isEnriching.value = false
  }
}
</script>

<template>
  <section
    aria-label="Brief du projet"
    class="space-y-8"
  >
    <template v-if="!brief">
      <AppListHeader
        title="Brief"
        icon="i-lucide-clipboard-list"
        :count="0"
      >
        <template #actions>
          <UButton
            icon="i-lucide-send"
            variant="soft"
            color="neutral"
            @click="openCreateModal"
          >
            Envoyer un brief pour cadrer ce projet
          </UButton>
        </template>
      </AppListHeader>
      <BriefsCreateModal
        v-model:open="isCreateModalOpen"
        :client-id="project.clientId"
        :contacts="clientDashboard?.contacts ?? []"
        :projects="[{ ...project, brief: null }]"
        :project-id="project.id"
        @created="refresh()"
      />
    </template>

    <AppCard
      v-else-if="brief.status !== 'completed'"
      title="Brief envoyé, en attente de réponse"
      :subtitle="`Lien valable jusqu’au ${formatDateOnly(brief.expiresAt)}${brief.contactName ? ` · ${brief.contactName}` : ''}. Les réponses compléteront les champs vides du projet.`"
    >
      <template #badge>
        <BriefsStatusBadge :status="brief.displayStatus" />
      </template>
      <UButton
        v-if="brief.displayStatus !== 'expired'"
        size="sm"
        variant="soft"
        icon="i-lucide-copy"
        @click="copy(brief.url)"
      >
        Copier le lien
      </UButton>
      <p
        v-else
        class="text-sm text-slate-500"
      >
        Lien expiré : régénérez-le depuis la fiche du contact.
      </p>
    </AppCard>

    <template v-else>
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-2">
          <BriefsStatusBadge :status="brief.displayStatus" />
          <h2 class="text-xl font-semibold tracking-tight text-slate-900">
            Brief pré-rendez-vous
          </h2>
          <p class="text-sm text-slate-500">
            <template v-if="brief.completedAt">
              Reçu le {{ formatDate(brief.completedAt) }}
            </template>
            <template v-else>
              Pas encore complété · lien valable jusqu’au {{ formatDateOnly(brief.expiresAt) }}
            </template>
            <template v-if="brief.contactName">
              · {{ brief.contactName }}
            </template>
            <template v-if="brief.formVersion">
              · formulaire v{{ brief.formVersion }}
            </template>
          </p>
        </div>
      </header>

      <UAlert
        v-if="brief.appliedFields?.length"
        color="info"
        variant="subtle"
        icon="i-lucide-clipboard-check"
        title="Champs du projet complétés par le brief"
        :description="`${brief.appliedFields.map(field => appliedFieldLabels[field] ?? field).join(', ')}. Les champs déjà renseignés n’ont pas été modifiés.`"
      />

      <section
        aria-labelledby="brief-summary"
        class="space-y-4"
      >
        <h3
          id="brief-summary"
          class="text-base font-semibold text-slate-900"
        >
          L’essentiel
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AppCard
            v-for="fact in keyFacts"
            :key="fact.label"
          >
            <div class="flex items-start gap-3">
              <UIcon
                :name="fact.icon"
                class="mt-0.5 shrink-0 text-lg text-slate-400"
              />
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {{ fact.label }}
                </p>
                <p :class="['font-semibold', factClass(fact.display)]">
                  {{ fact.display.text }}
                </p>
              </div>
            </div>
          </AppCard>
        </div>

        <AppCard>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Objectifs
              </p>
              <ul
                v-if="summary.goals?.status === 'answered'"
                class="mt-1 list-inside list-disc text-slate-900"
              >
                <li
                  v-for="goal in summary.goals.value"
                  :key="goal"
                >
                  {{ goal }}
                </li>
              </ul>
              <p
                v-else
                :class="factClass(goalsDisplay)"
              >
                {{ goalsDisplay.text }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Contexte de l’échéance
              </p>
              <p :class="factClass(deadlineContextDisplay)">
                {{ deadlineContextDisplay.text }}
              </p>
            </div>
          </div>
        </AppCard>
      </section>

      <section
        v-if="alerts.length > 0"
        aria-labelledby="brief-alerts"
        class="space-y-3"
      >
        <h3
          id="brief-alerts"
          class="text-base font-semibold text-slate-900"
        >
          Points de vigilance
        </h3>
        <UAlert
          v-for="alert in alerts"
          :key="alert.id"
          :color="alert.level"
          variant="subtle"
          :icon="alertIcon(alert.level)"
          :title="alert.title"
          :description="alert.description"
        />
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="brief-declared"
          class="space-y-3"
        >
          <h3
            id="brief-declared"
            class="text-base font-semibold text-slate-900"
          >
            Technique : déclaré par le prospect
          </h3>
          <AppCard>
            <dl class="divide-y divide-slate-100">
              <div
                v-for="fact in declaredFacts"
                :key="fact.label"
                class="flex items-start justify-between gap-4 py-2"
              >
                <dt class="flex items-center gap-2 text-sm text-slate-500">
                  <UIcon :name="fact.icon" />
                  {{ fact.label }}
                </dt>
                <dd :class="['text-right text-sm font-medium', factClass(fact.display)]">
                  {{ fact.display.text }}
                </dd>
              </div>
            </dl>
          </AppCard>
        </section>

        <section
          aria-labelledby="brief-detected"
          class="space-y-3"
        >
          <div class="flex items-center justify-between gap-3">
            <h3
              id="brief-detected"
              class="text-base font-semibold text-slate-900"
            >
              Technique : détecté automatiquement
            </h3>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-refresh-cw"
              :loading="isEnriching"
              @click="relaunchEnrichment"
            >
              Relancer l’analyse
            </UButton>
          </div>
          <AppCard>
            <p
              v-if="brief.enrichmentStatus === 'pending'"
              class="text-sm text-slate-500"
            >
              Analyse du domaine en cours…
            </p>
            <template v-else-if="enrichment">
              <dl class="divide-y divide-slate-100">
                <div
                  v-for="fact in detectedFacts"
                  :key="fact.label"
                  class="flex items-start justify-between gap-4 py-2"
                >
                  <dt class="text-sm text-slate-500">
                    {{ fact.label }}
                  </dt>
                  <dd :class="['break-all text-right text-sm font-medium', fact.value ? 'text-slate-900' : 'text-slate-400']">
                    {{ fact.value || 'Non détecté' }}
                  </dd>
                </div>
              </dl>
              <ul
                v-if="enrichment.errors"
                class="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500"
              >
                <li
                  v-for="(message, probe) in enrichment.errors"
                  :key="probe"
                >
                  {{ message }}
                </li>
              </ul>
              <p
                v-if="brief.enrichedAt"
                class="mt-3 text-xs text-slate-400"
              >
                Analyse du {{ formatDate(brief.enrichedAt) }}
              </p>
            </template>
            <p
              v-else
              class="text-sm text-slate-500"
            >
              {{ brief.enrichmentStatus === 'failed' ? 'L’analyse a échoué.' : 'Aucune analyse pour l’instant.' }}
            </p>
          </AppCard>
        </section>
      </div>

      <section
        aria-labelledby="brief-answers"
        class="space-y-4"
      >
        <h3
          id="brief-answers"
          class="text-base font-semibold text-slate-900"
        >
          Réponses complètes
        </h3>
        <p
          v-if="sections.length === 0"
          class="text-sm text-slate-500"
        >
          Aucune réponse reçue pour l’instant.
        </p>
        <AppCard
          v-for="section in sections"
          :key="section.title"
          :title="section.title"
        >
          <dl class="divide-y divide-slate-100">
            <div
              v-for="answer in section.answers"
              :key="answer.id"
              class="grid gap-1 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-6"
            >
              <dt class="text-sm text-slate-500">
                {{ answer.label }}
              </dt>
              <dd class="whitespace-pre-line text-sm text-slate-900">
                <UBadge
                  v-if="answer.status === 'unknown'"
                  variant="soft"
                  color="warning"
                  class="rounded-full"
                >
                  Ne sait pas
                </UBadge>
                <template v-else>
                  {{ formatBriefAnswerValue(answer.value) }}
                </template>
              </dd>
            </div>
          </dl>
        </AppCard>
      </section>
    </template>
  </section>
</template>
