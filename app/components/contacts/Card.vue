<script setup lang="ts">
import type { Contact } from '~/types'

const props = defineProps<{
  contact: Contact
}>()

const emit = defineEmits<{
  edit: [contactId: number]
  delete: [contactId: number]
}>()

const infos = computed(() => [
  props.contact.email ? { icon: 'i-lucide-mail', label: props.contact.email } : null,
  props.contact.phone ? { icon: 'i-lucide-phone', label: props.contact.phone } : null,
  props.contact.mobile ? { icon: 'i-lucide-smartphone', label: props.contact.mobile } : null
].filter(i => i !== null))
</script>

<template>
  <AppCard
    :title="`${contact.firstName} ${contact.lastName}`"
    :subtitle="contact.position ?? undefined"
    :infos="infos"
  >
    <template #actions>
      <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-pencil"
          aria-label="Modifier le contact"
          @click="emit('edit', contact.id)"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-trash-2"
          aria-label="Supprimer le contact"
          @click="emit('delete', contact.id)"
        />
      </div>
    </template>

    <p
      v-if="contact.notes"
      class="line-clamp-2 text-sm leading-5 text-slate-500"
    >
      {{ contact.notes }}
    </p>
  </AppCard>
</template>
