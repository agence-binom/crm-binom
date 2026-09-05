<script setup lang="ts">
import type { Contact } from '~/types'

const props = defineProps<{
  open: boolean
  contacts: Contact[]
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

const { showError, showSuccess } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const pendingContactId = ref<number | null>(null)

const activeContacts = computed(() => props.contacts.filter(contact => !contact.archived))

const isActive = (contact: Contact) => contact.portalStatus === 'active'

const runPortalAction = async (contact: Contact, action: 'invite' | 'revoke', feedback: {
  successTitle: string
  successBody: string
  errorTitle: string
  errorFallback: string
}) => {
  pendingContactId.value = contact.id
  try {
    await $fetch(`/api/contacts/${contact.id}/portal/${action}`, { method: 'POST' })
    showSuccess(feedback.successTitle, feedback.successBody)
    emit('saved')
  } catch (error) {
    showError(feedback.errorTitle, error, feedback.errorFallback)
  } finally {
    pendingContactId.value = null
  }
}

const onToggle = (contact: Contact, nextActive: boolean) => runPortalAction(
  contact,
  nextActive ? 'invite' : 'revoke',
  nextActive
    ? {
        successTitle: 'Accès activé',
        successBody: `${contact.firstName} ${contact.lastName} peut désormais se connecter à son espace client.`,
        errorTitle: 'Activation impossible',
        errorFallback: 'Impossible de donner accès au portail à ce contact.'
      }
    : {
        successTitle: 'Accès révoqué',
        successBody: `${contact.firstName} ${contact.lastName} ne peut plus accéder à son espace client.`,
        errorTitle: 'Révocation impossible',
        errorFallback: 'Impossible de révoquer l’accès portail de ce contact.'
      }
)

const onResend = (contact: Contact) => runPortalAction(contact, 'invite', {
  successTitle: 'Lien envoyé',
  successBody: `Un lien de connexion a été renvoyé à ${contact.firstName} ${contact.lastName}.`,
  errorTitle: 'Envoi impossible',
  errorFallback: 'Impossible de renvoyer le lien de connexion.'
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Accès à l'espace client"
    aria-describedby="Gérer les contacts autorisés à se connecter à l'espace client"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-2xl rounded-2xl"
  >
    <template #body>
      <AppEmptyState
        v-if="activeContacts.length === 0"
        icon="i-lucide-user-x"
        title="Aucun contact pour ce client"
        variant="bare"
      />

      <ul
        v-else
        class="divide-y divide-slate-100"
      >
        <li
          v-for="contact in activeContacts"
          :key="contact.id"
          class="flex items-center justify-between gap-4 py-3"
        >
          <div class="min-w-0">
            <p class="font-medium truncate">
              {{ contact.firstName }} {{ contact.lastName }}
            </p>
            <p class="text-sm text-slate-500 truncate">
              {{ contact.email ?? 'Aucun email renseigné' }}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <UButton
              v-if="isActive(contact)"
              size="xs"
              variant="soft"
              color="neutral"
              icon="i-lucide-send"
              :loading="pendingContactId === contact.id"
              @click="onResend(contact)"
            >
              Envoyer le lien
            </UButton>
            <USwitch
              :model-value="isActive(contact)"
              :disabled="!contact.email || pendingContactId === contact.id"
              :aria-label="`Activer l'accès portail de ${contact.firstName} ${contact.lastName}`"
              @update:model-value="value => onToggle(contact, value)"
            />
          </div>
        </li>
      </ul>
    </template>
  </UModal>
</template>
