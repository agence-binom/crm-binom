<script setup lang="ts">
import { getProjectDisplayStatus, toProjectInputDate } from '~/lib/projects'
import { projectCreateSchema, projectUpdateSchema } from '~/validation/projects'
import type { Project } from '~/validation/projects'

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
const isEditing = computed(() => props.projectId != null)

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
    class="w-full max-w-3xl"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nom du projet"
          name="name"
          required
        >
          <UInput
            v-model="formState.name"
            placeholder="Ex: Refonte site web"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
          class="w-full"
        >
          <UTextarea
            v-model="formState.description"
            :rows="3"
            placeholder="Description du projet..."
            class="w-full"
          />
        </UFormField>

        <div class="flex gap-4">
          <UFormField
            label="Date de début"
            name="startDate"
            class="flex-1"
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
            class="flex-1"
          >
            <UInput
              v-model="formState.endDate"
              type="date"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Statut affiché"
          name="statusPreview"
        >
          <div class="rounded-lg border border-default bg-elevated/40 px-3 py-2">
            <p class="font-medium">
              {{ displayStatusLabel }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              Le statut est calculé automatiquement à partir des dates du projet.
            </p>
          </div>
        </UFormField>

        <UFormField
          label="URL du projet"
          name="url"
          class="w-full"
        >
          <UInput
            v-model="formState.url"
            type="url"
            placeholder="https://example.com"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            variant="soft"
            color="neutral"
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
      </UForm>
    </template>
  </UModal>
</template>
