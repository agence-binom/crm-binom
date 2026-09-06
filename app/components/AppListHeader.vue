<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  icon?: string
  count: number
  level?: 'h1' | 'h2'
  bordered?: boolean
}>(), {
  icon: undefined,
  level: 'h2',
  bordered: true
})
</script>

<template>
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    :class="bordered ? 'border-b border-slate-100 pb-4' : ''"
  >
    <component
      :is="level"
      :class="['flex items-center gap-2 font-semibold tracking-tight text-slate-900', level === 'h1' ? 'text-2xl' : 'text-xl']"
    >
      <UIcon
        v-if="icon"
        :name="icon"
      />
      {{ title }}
      <UBadge
        color="neutral"
        variant="soft"
        class="rounded-full"
      >
        {{ count }}
      </UBadge>
    </component>

    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
