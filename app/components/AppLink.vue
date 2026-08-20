<script lang="ts" setup>
const props = withDefaults(defineProps<{
  to: string
  variant?: 'primary' | 'secondary' | 'tertiary'
  ariaLabel?: string
}>(), {
  variant: 'primary'
})

const variantClass: Record<NonNullable<typeof props.variant>, string> = {
  primary: 'rounded-md px-2 py-1 hover:bg-neutral-100',
  secondary: 'rounded-md px-2 py-1 hover:bg-neutral-50',
  tertiary: 'text-slate-700 hover:text-primary-600 hover:underline'
}
</script>

<template>
  <NuxtLink
    :to="props.to"
    :class="['inline-flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', variantClass[variant]]"
    :aria-label="props.ariaLabel"
  >
    <slot />
  </NuxtLink>
</template>
