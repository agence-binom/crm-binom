<script setup lang="ts">
const props = withDefaults(defineProps<{
  icon: string
  iconClass?: string
  title: string
  description?: string
  /** `panel`: prominent dashed card (lists/dashboards). `compact`: smaller dashed card (nested sections). `bare`: no wrapper (already inside a bordered container, e.g. a table). */
  variant?: 'panel' | 'compact' | 'bare'
  /** Only affects the `panel` variant's padding/icon size. */
  size?: 'md' | 'lg'
}>(), {
  iconClass: undefined,
  description: undefined,
  variant: 'panel',
  size: 'md'
})

const wrapperClass = computed(() => {
  if (props.variant === 'bare') {
    return 'flex flex-col items-center justify-center gap-3 px-6 text-center'
  }

  if (props.variant === 'compact') {
    return 'rounded-xl border border-dashed border-default p-6 text-center text-gray-500'
  }

  return [
    'rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 text-center',
    props.size === 'lg' ? 'py-12' : 'py-10'
  ].join(' ')
})

const iconSizeClass = computed(() => (props.size === 'lg' ? 'text-6xl' : 'text-4xl'))

const titleClass = computed(() => {
  if (props.variant === 'compact') {
    return 'font-medium text-gray-700 dark:text-gray-200'
  }

  if (props.variant === 'bare') {
    return 'font-medium text-slate-700'
  }

  return props.size === 'lg' ? 'text-xl font-bold text-slate-600' : 'text-slate-600'
})
</script>

<template>
  <div :class="wrapperClass">
    <UIcon
      :name="icon"
      :class="[variant === 'bare' ? '' : 'mb-3', iconSizeClass, iconClass ?? 'text-slate-300']"
    />
    <div class="space-y-1">
      <p :class="titleClass">
        {{ title }}
      </p>
      <p
        v-if="description"
        class="text-sm"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="mt-4"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
