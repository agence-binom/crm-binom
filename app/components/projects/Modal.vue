<script setup lang="ts">
import { getProjectDisplayStatus, toProjectInputDate } from '~/lib/projects'
import { projectCreateSchema, projectUpdateSchema } from '~/validation/projects'
import type { Project } from '~/types'

const props = defineProps<{
  open: boolean
  projectId?: number | null
  project?: Project | null
  clientId: number
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()
const { showError } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
const isEditing = computed(() => Boolean(props.project))

const schema = computed(() => (isEditing.value ? projectUpdateSchema : projectCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le projet' : 'Nouveau projet'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer le projet'))

const formState = reactive({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  url: '',
  clientId: props.clientId
})

const resetForm = () => {
  Object.assign(formState, {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    url: '',
    clientId: props.clientId
  })
}

const fillFromProject = (project: Project) => {
  Object.assign(formState, {
    name: project.name ?? '',
    description: project.description ?? '',
    startDate: toProjectInputDate(project.startDate),
    endDate: toProjectInputDate(project.endDate),
    url: project.url ?? '',
    clientId: props.clientId
  })
}

const displayStatus = computed(() => {
  return getProjectDisplayStatus({
    startDate: formState.startDate || null,
    endDate: formState.endDate || null,
    status: props.project?.status ?? 'en_cours'
  })
})

const displayStatusLabel = computed(() => {
  switch (displayStatus.value) {
    case 'termine':
      return 'Terminé'
    case 'en_attente':
      return 'En attente'
    case 'annule':
      return 'Annulé'
    default:
      return 'En cours'
  }
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (isEditing.value && props.project) fillFromProject(props.project)
    else resetForm()
  },
  { immediate: true }
)

watch(
  () => props.project,
  (project) => {
    if (!props.open) return
    if (isEditing.value && project) fillFromProject(project)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      name: formState.name,
      description: formState.description,
      status: displayStatus.value,
      startDate: formState.startDate || undefined,
      endDate: formState.endDate || undefined,
      url: formState.url || undefined,
      clientId: formState.clientId
    }

    if (isEditing.value) {
      if (!props.projectId) throw new Error('projectId manquant pour la mise à jour')
      await $fetch(`/api/projects/${props.projectId}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/projects', { method: 'POST', body })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du projet:', error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible de sauvegarder le projet.'
    )
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :aria-describedby="isEditing ? 'Modifier les informations du projet' : 'Créer un nouveau projet'"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-3xl rounded-2xl"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="space-y-6">
          <UFormField
            label="Nom du projet"
            name="name"
            required
          >
            <UInput
              v-model="formState.name"
              placeholder="Ex: Refonte site web"
              class="w-full"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <UFormField
              label="URL du projet"
              name="url"
            >
              <UInput
                v-model="formState.url"
                type="url"
                placeholder="https://example.com"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="isEditing"
              label="Statut affiché"
              name="statusPreview"
            >
              <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="font-medium text-slate-900">
                  {{ displayStatusLabel }}
                </p>
                <p class="mt-1 text-sm text-slate-500">
                  Calculé automatiquement à partir des dates du projet.
                </p>
              </div>
            </UFormField>
          </div>

          <UFormField
            label="Description"
            name="description"
            class="w-full"
          >
            <UTextarea
              v-model="formState.description"
              :rows="4"
              placeholder="Décris brièvement le périmètre, l'objectif ou le contexte."
              class="w-full"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Date de début"
              name="startDate"
            >
              <UInput
                v-model="formState.startDate"
                type="date"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Date de fin"
              name="endDate"
            >
              <UInput
                v-model="formState.endDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <UButton
              variant="soft"
              color="neutral"
              :disabled="isSaving"
              @click="isOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              type="submit"
              :loading="isSaving"
            >
              {{ submitLabel }}
            </UButton>
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
