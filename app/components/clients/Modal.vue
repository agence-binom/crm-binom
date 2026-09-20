<script setup lang="ts">
import {
  defaultClientIcon,
  getClientIcon
} from '~/lib/clients'
import { clientIconOptions } from '~/lib/client-icons'
import { clientCreateSchema, clientUpdateSchema } from '~/validation/clients'
import { prospectionStatuses, type ProspectionStatus } from '~/constants/prospection'
import { getProspectionStatusLabel } from '~/lib/prospection'
import { toProjectInputDate } from '~/lib/projects'
import type { Client } from '~/types'

const prospectionStatusOptions = prospectionStatuses.map(status => ({ value: status, label: getProspectionStatusLabel(status) }))

const props = defineProps<{
  open: boolean
  clientId?: number | null
  client?: Client | null
  initialValues?: Partial<Client> | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': [client?: Client]
}>()
const { showError } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
const isEditing = computed(() => props.clientId != null)

const schema = computed(() => (isEditing.value ? clientUpdateSchema : clientCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le client' : 'Nouveau client'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer le client'))
const getOptionValue = (item: unknown) => {
  if (!item || typeof item !== 'object' || !('value' in item)) {
    return defaultClientIcon
  }

  return typeof item.value === 'string' ? item.value : defaultClientIcon
}
const createDefaultFormState = () => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  website: '',
  siret: '',
  notes: '',
  icon: defaultClientIcon,
  archived: false,
  description: '',
  prospectionStatus: 'nouveau' as ProspectionStatus,
  contactedAt: '',
  relancedAt: ''
})
const createFormStateFromInitialValues = (initialValues?: Partial<Client> | null) => ({
  ...createDefaultFormState(),
  name: initialValues?.name ?? '',
  email: initialValues?.email ?? '',
  phone: initialValues?.phone ?? '',
  address: initialValues?.address ?? '',
  city: initialValues?.city ?? '',
  postalCode: initialValues?.postalCode ?? '',
  country: initialValues?.country ?? '',
  website: initialValues?.website ?? '',
  siret: initialValues?.siret ?? '',
  notes: initialValues?.notes ?? '',
  icon: getClientIcon(initialValues?.icon),
  archived: initialValues?.archived ?? false,
  description: initialValues?.description ?? '',
  prospectionStatus: initialValues?.prospectionStatus ?? 'nouveau',
  contactedAt: toProjectInputDate(initialValues?.contactedAt),
  relancedAt: toProjectInputDate(initialValues?.relancedAt)
})
const createFormStateFromClient = (client?: Client | null) => ({
  ...createFormStateFromInitialValues(props.initialValues),
  name: client?.name ?? '',
  email: client?.email ?? createFormStateFromInitialValues(props.initialValues).email,
  phone: client?.phone ?? createFormStateFromInitialValues(props.initialValues).phone,
  address: client?.address ?? createFormStateFromInitialValues(props.initialValues).address,
  city: client?.city ?? createFormStateFromInitialValues(props.initialValues).city,
  postalCode: client?.postalCode ?? createFormStateFromInitialValues(props.initialValues).postalCode,
  country: client?.country ?? createFormStateFromInitialValues(props.initialValues).country,
  website: client?.website ?? createFormStateFromInitialValues(props.initialValues).website,
  siret: client?.siret ?? createFormStateFromInitialValues(props.initialValues).siret,
  notes: client?.notes ?? createFormStateFromInitialValues(props.initialValues).notes,
  icon: getClientIcon(client?.icon ?? props.initialValues?.icon),
  archived: client?.archived ?? props.initialValues?.archived ?? false,
  description: client?.description ?? createFormStateFromInitialValues(props.initialValues).description,
  prospectionStatus: client?.prospectionStatus ?? props.initialValues?.prospectionStatus ?? 'nouveau',
  contactedAt: client?.contactedAt ? toProjectInputDate(client.contactedAt) : createFormStateFromInitialValues(props.initialValues).contactedAt,
  relancedAt: client?.relancedAt ? toProjectInputDate(client.relancedAt) : createFormStateFromInitialValues(props.initialValues).relancedAt
})
const formState = reactive(createDefaultFormState())

const applyFormState = (client?: Client | null) => Object.assign(formState, createFormStateFromClient(client))

watch(
  () => props.open,
  (open) => {
    if (!open) return
    applyFormState(isEditing.value ? props.client : null)
  },
  { immediate: true }
)

watch(
  () => props.client,
  (client) => {
    if (!props.open) return
    if (isEditing.value) applyFormState(client)
  }
)

watch(
  () => props.initialValues,
  () => {
    if (!props.open || isEditing.value) return
    applyFormState(null)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      ...formState,
      contactedAt: formState.contactedAt || null,
      relancedAt: formState.relancedAt || null
    }
    let savedClient: Client | undefined

    if (isEditing.value) {
      if (!props.clientId) throw new Error('clientId manquant pour la mise à jour')
      const response = await $fetch<{ client: Client }>(`/api/clients/${props.clientId}`, { method: 'PUT', body })
      savedClient = response.client
    } else {
      const response = await $fetch<{ client: Client }>('/api/clients', { method: 'POST', body })
      savedClient = response.client
    }

    emit('saved', savedClient)
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du client:', error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible de sauvegarder le client.'
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
    :aria-describedby="isEditing ? 'Modifier les informations du client' : 'Créer un nouveau client'"
    class="w-full max-w-3xl rounded-2xl"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
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
            label="Nom de l'entreprise"
            name="name"
            required
          >
            <UInput
              v-model="formState.name"
              placeholder="Ex: Entreprise ABC"
            />
          </UFormField>

          <UFormField
            label="Icône client"
            name="icon"
          >
            <USelect
              v-model="formState.icon"
              :items="clientIconOptions"
              value-attribute="value"
              option-attribute="label"
              class="w-full"
            >
              <template #leading>
                <UIcon
                  :name="formState.icon || defaultClientIcon"
                  class="text-base text-dimmed"
                />
              </template>

              <template #item-leading="{ item }">
                <UIcon
                  :name="getOptionValue(item)"
                  class="text-base text-dimmed"
                />
              </template>
            </USelect>
          </UFormField>

          <UFormField
            label="Statut de prospection"
            name="prospectionStatus"
          >
            <USelect
              v-model="formState.prospectionStatus"
              :items="prospectionStatusOptions"
              value-attribute="value"
              option-attribute="label"
              class="w-full"
            />
          </UFormField>

          <div
            v-if="isEditing"
            class="grid gap-4 sm:grid-cols-2"
          >
            <UFormField
              label="Date de contact"
              name="contactedAt"
              description="Renseigner cette date fait passer le dossier en 'Contacté' si ce n'est pas déjà fait."
            >
              <UInput
                v-model="formState.contactedAt"
                type="date"
              />
            </UFormField>

            <UFormField
              label="Date de relance"
              name="relancedAt"
              description="Renseigner cette date fait passer le dossier en 'Relancé' si ce n'est pas déjà fait."
            >
              <UInput
                v-model="formState.relancedAt"
                type="date"
              />
            </UFormField>
          </div>

          <UFormField
            label="Description"
            name="description"
          >
            <UTextarea
              v-model="formState.description"
              :rows="3"
              placeholder="Quelques mots pour resituer le client ou sa mission."
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Email"
              name="email"
            >
              <UInput
                v-model="formState.email"
              />
            </UFormField>

            <UFormField
              label="Téléphone"
              name="phone"
            >
              <UInput
                v-model="formState.phone"
                type="tel"
              />
            </UFormField>
          </div>

          <UFormField
            label="Adresse"
            name="address"
          >
            <UInput
              v-model="formState.address"
              type="text"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Code postal"
              name="postalCode"
            >
              <UInput
                v-model="formState.postalCode"
                type="text"
              />
            </UFormField>

            <UFormField
              label="Ville"
              name="city"
            >
              <UInput
                v-model="formState.city"
                type="text"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <UFormField
              label="Pays"
              name="country"
            >
              <UInput
                v-model="formState.country"
                type="text"
              />
            </UFormField>

            <UFormField
              label="Site web"
              name="website"
            >
              <UInput
                v-model="formState.website"
                type="url"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <UFormField
              label="SIRET"
              name="siret"
            >
              <UInput
                v-model="formState.siret"
                type="text"
                placeholder="12345678901234"
              />
            </UFormField>

            <UFormField
              label="Notes"
              name="notes"
            >
              <UTextarea
                v-model="formState.notes"
                :rows="3"
              />
            </UFormField>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <UButton
              color="neutral"
              variant="soft"
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
