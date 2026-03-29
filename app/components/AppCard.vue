<script setup lang="ts">
type Badge = {
  label: string
  color?: 'neutral' | 'primary' | 'success' | 'warning' | 'error'
  icon?: string
}

type Info = {
  icon: string
  label: string
}

withDefaults(defineProps<{
  badge?: Badge
  title: string
  subtitle?: string
  infos?: Info[]
  hoverable?: boolean
}>(), {
  hoverable: false
})
</script>

<template>
  <UCard
    :class="[
      'group relative h-full rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 backdrop-blur',
      hoverable && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'
    ]"
  >
    <div class="space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 space-y-2">
          <UBadge
            v-if="badge"
            variant="soft"
            :color="badge.color ?? 'neutral'"
            :icon="badge.icon"
            class="rounded-full px-3"
          >
            {{ badge.label }}
          </UBadge>
          <h3 class="truncate text-lg font-semibold tracking-tight text-slate-900">
            {{ title }}
          </h3>
          <p
            v-if="subtitle"
            class="line-clamp-2 text-sm leading-5 text-slate-500"
          >
            {{ subtitle }}
          </p>
        </div>
        <slot name="actions" />
      </div>

      <slot />

      <div
        v-if="infos?.length"
        class="flex flex-wrap gap-2 border-t border-gray-100 pt-3"
      >
        <UBadge
          v-for="info in infos"
          :key="info.icon"
          variant="soft"
          color="neutral"
          :icon="info.icon"
          class="rounded-full"
        >
          {{ info.label }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>
