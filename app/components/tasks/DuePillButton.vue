<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  color?: 'info' | 'neutral'
  clearLabel?: string
}>()

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <UPopover>
    <UButton
      :icon="icon"
      :label="label"
      variant="soft"
      :color="color ?? 'neutral'"
      size="sm"
      class="group rounded-full"
    >
      <template
        v-if="clearLabel"
        #trailing
      >
        <span
          role="button"
          tabindex="0"
          :aria-label="clearLabel"
          class="flex items-center justify-center rounded-full p-0.5 hover:bg-black/10"
          @click.stop="emit('clear')"
          @keydown.enter.stop.prevent="emit('clear')"
        >
          <UIcon
            name="i-lucide-x"
            class="size-3.5"
          />
        </span>
      </template>
    </UButton>

    <template #content>
      <slot />
    </template>
  </UPopover>
</template>
