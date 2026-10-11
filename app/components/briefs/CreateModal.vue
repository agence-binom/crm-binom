<script setup lang="ts">
import { defaultBriefExpiresInDays, maxBriefExpiresInDays } from '~/constants/briefs'
import { formatDateOnly } from '~/lib/utils'
import type { Brief, Contact, Project } from '~/types'

const NO_CONTACT = 'none'
const NEW_PROJECT = 'new'

const props = defineProps<{
  open: boolean
  clientId: number
  contacts: Contact[]
  // Projets du client : seuls ceux sans brief peuvent être visés (un projet a au plus un brief).
  projects?: Project[]
  // Présélectionné depuis la fiche d'un projet ; absent = nouveau projet créé à réception.
  projectId?: number | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'created': [brief: Brief]
}>()

const { showError } = useFeedbackToast()
const { copy } = useCopyToClipboard()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const activeContacts = computed(() => props.contacts.filter(contact => !contact.archived))

const contactOptions = computed(() => [
  { value: NO_CONTACT, label: 'Aucun contact (coordonnées de l’entreprise)' },
  ...activeContacts.value.map(contact => ({ value: String(contact.id), label: `${contact.firstName} ${contact.lastName}`.trim() }))
])

const targetOptions = computed(() => [
  { value: NEW_PROJECT, label: 'Nouveau projet, créé à la réception du brief' },
  ...(props.projects ?? [])
    .filter(project => !project.brief && !project.archived)
    .map(project => ({ value: String(project.id), label: `Projet existant : ${project.name}` }))
])

const selectedContact = ref(NO_CONTACT)
const selectedTarget = ref(NEW_PROJECT)
const expiresInDays = ref(defaultBriefExpiresInDays)
const isSaving = ref(false)
const createdBrief = ref<Brief | null>(null)

watch(() => props.open, (open) => {
  if (!open) return
  selectedContact.value = activeContacts.value.length === 1 ? String(activeContacts.value[0]!.id) : NO_CONTACT
  selectedTarget.value = props.projectId ? String(props.projectId) : NEW_PROJECT
  expiresInDays.value = defaultBriefExpiresInDays
  createdBrief.value = null
}, { immediate: true })

const onSubmit = async () => {
  isSaving.value = true
  try {
    const brief = await $fetch<Brief>(`/api/clients/${props.clientId}/briefs`, {
      method: 'POST',
      body: {
        contactId: selectedContact.value === NO_CONTACT ? null : Number(selectedContact.value),
        projectId: selectedTarget.value === NEW_PROJECT ? null : Number(selectedTarget.value),
        expiresInDays: expiresInDays.value
      }
    })
    createdBrief.value = brief
    emit('created', brief)
  } catch (error) {
    showError('Création impossible', error, 'Le lien de brief n’a pas pu être généré.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Envoyer le brief"
    description="Génère un lien personnel vers le formulaire de brief, à transmettre au prospect."
    class="w-full max-w-xl rounded-2xl"
  >
    <template #body>
      <div
        v-if="createdBrief"
        class="space-y-4"
      >
        <p class="text-sm text-slate-600">
          Lien généré, valable jusqu’au {{ formatDateOnly(createdBrief.expiresAt) }}. Il reste disponible sur la fiche du contact tant que le brief n’est pas complété.
        </p>
        <div class="flex gap-2">
          <UInput
            :model-value="createdBrief.url"
            readonly
            class="flex-1"
            aria-label="Lien du brief"
          />
          <UButton
            icon="i-lucide-copy"
            @click="copy(createdBrief.url)"
          >
            Copier
          </UButton>
        </div>
      </div>

      <form
        v-else
        class="space-y-5"
        @submit.prevent="onSubmit"
      >
        <UFormField
          label="Pour"
          description="Un nouveau projet n’est créé que si le prospect renvoie le brief. Un projet existant voit seulement ses champs vides complétés."
        >
          <USelect
            v-model="selectedTarget"
            :items="targetOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Destinataire"
          description="Son prénom, son nom et ses coordonnées préremplissent le formulaire."
        >
          <USelect
            v-model="selectedContact"
            :items="contactOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Validité du lien (jours)"
          :description="`Entre 1 et ${maxBriefExpiresInDays} jours.`"
        >
          <UInput
            v-model.number="expiresInDays"
            type="number"
            :min="1"
            :max="maxBriefExpiresInDays"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            type="submit"
            icon="i-lucide-link"
            :loading="isSaving"
          >
            Générer le lien
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
