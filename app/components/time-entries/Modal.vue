<script setup lang="ts">
import { timeEntryCreateSchema, timeEntryUpdateSchema } from '~/validation/time-entries.ts'
import type { TimeEntry } from '~/types'

type TimeEntryAssignee = { id: number, name: string }

const props = defineProps<{
  open: boolean
  timeEntryId?: number | null
  timeEntry?: TimeEntry | null
  taskId: number
  assignees?: TimeEntryAssignee[]
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
const isEditing = computed(() => Boolean(props.timeEntry))

const schema = computed(() => (isEditing.value ? timeEntryUpdateSchema : timeEntryCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le temps passé' : 'Nouveau temps passé'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Ajouter le temps'))

// Repli sur la liste complète des utilisateurs si la tâche n'a aucun assigné.
const { data: usersData, refresh: refreshUsers } = await useFetch('/api/users', { immediate: false })

const userOptions = computed(() => {
  const source = props.assignees?.length ? props.assignees : (usersData.value?.users ?? [])
  return source.map(user => ({ label: user.name, value: user.id }))
})

const defaultUserId = computed(() => (props.assignees?.length === 1 ? props.assignees[0]!.id : undefined))

const formState = reactive({
  notes: '',
  duration: undefined,
  taskId: props.taskId,
  userId: defaultUserId.value
})

const resetForm = () => {
  Object.assign(formState, {
    notes: '',
    duration: undefined,
    taskId: props.taskId,
    userId: defaultUserId.value
  })
}

const fillFromProject = (timeEntry: TimeEntry) => {
  Object.assign(formState, {
    notes: timeEntry.notes,
    duration: timeEntry.duration,
    taskId: timeEntry.taskId,
    userId: timeEntry.userId
  })
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (isEditing.value && props.timeEntry) fillFromProject(props.timeEntry)
    else resetForm()
    if (!props.assignees?.length && !usersData.value) refreshUsers()
  },
  { immediate: true }
)

watch(
  () => props.timeEntry,
  (timeEntry) => {
    if (!props.open) return
    if (isEditing.value && timeEntry) fillFromProject(timeEntry)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      notes: formState.notes,
      duration: formState.duration,
      taskId: formState.taskId,
      userId: formState.userId
    }

    if (isEditing.value) {
      if (!props.timeEntryId) throw new Error('timeEntryId manquant pour la mise à jour')
      await $fetch(`/api/time-entries/${props.timeEntryId}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/time-entries', { method: 'POST', body })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du temps:', error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible de sauvegarder le temps.'
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
    :aria-describedby="isEditing ? 'Modifier les données' : 'Ajouter un temps'"
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
            label="Description"
            name="notes"
          >
            <UInput
              v-model="formState.notes"
              placeholder="Ex: Réunion avec le client"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Temps passé (en minutes)"
            name="duration"
            class="w-full"
          >
            <UInput
              v-model="formState.duration"
              type="number"
              placeholder="30"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Utilisateur"
            name="userId"
            class="w-full"
          >
            <USelect
              v-model="formState.userId"
              :items="userOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Sélectionner un utilisateur"
              class="w-full"
            />
          </UFormField>

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
