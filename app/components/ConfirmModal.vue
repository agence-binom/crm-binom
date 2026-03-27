<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  message?: string
}>(), {
  title: 'Confirmer',
  message: 'Êtes-vous sûr de vouloir effectuer cette action ?'
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'confirm': []
  'cancel': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="props.title"
    :aria-describedby="'Confirmation de l\'action'"
    :closable="false"
    size="sm"
  >
    <template #header>
      <h2 class="text-lg font-semibold">
        {{ props.title }}
      </h2>
    </template>
    <template #body>
      <p>{{ message }}</p>
    </template>
    <template #footer>
      <UButton
        variant="outline"
        @click="$emit('cancel')"
      >
        Annuler
      </UButton>
      <UButton
        color="primary"
        @click="$emit('confirm')"
      >
        Confirmer
      </UButton>
    </template>
  </UModal>
</template>
