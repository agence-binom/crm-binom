<script setup lang="ts">
import type { Client } from '~/types'

const props = defineProps<{
  client: Client
}>()

const emit = defineEmits<{
  openInfo: []
  delete: [clientId: number]
}>()

const contactInfos = computed(() => [
  { value: props.client?.email, icon: 'i-lucide-mail' },
  { value: props.client?.phone, icon: 'i-lucide-phone' },
  { value: props.client?.website, icon: 'i-lucide-globe' }
])
</script>

<template>
  <div class="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
    <div class="flex flex-col gap-2 flex-1">
      <h1 class="text-3xl font-bold">
        {{ client.name }}
      </h1>
      <p
        v-if="client.description"
        class="text-gray-600"
      >
        {{ client.description }}
      </p>
      <ul class="flex gap-2 mt-2">
        <li
          v-for="(contact, i) in contactInfos"
          :key="i"
        >
          <UBadge
            v-if="contact.value"
            variant="soft"
            color="neutral"
            class="font-medium rounded-full"
            :icon="contact.icon"
          >
            {{ contact.value }}
          </UBadge>
        </li>
      </ul>
    </div>

    <div class="flex items-center gap-2">
      <UButton
        variant="soft"
        icon="i-lucide-info"
        color="info"
        @click="emit('openInfo')"
      >
        Informations
      </UButton>
      <UButton
        size="sm"
        variant="ghost"
        color="error"
        icon="i-lucide-trash"
        aria-label="Supprimer le client"
        @click="emit('delete', client.id)"
      />
    </div>
  </div>
</template>
