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

const props = withDefaults(defineProps<{
  badge?: Badge
  title?: string
  subtitle?: string
  infos?: Info[]
  hoverable?: boolean
  clickable?: boolean
}>(), {
  hoverable: false,
  clickable: false
})

const slots = useSlots()
const hasHeader = computed(() => Boolean(props.badge || slots.badge || props.title || props.subtitle || slots.actions))
</script>

<template>
  <UCard
    :class="[
      'group relative h-full rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 backdrop-blur',
      hoverable && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
      clickable && 'cursor-pointer hover:shadow-md focus-within:shadow-md focus-within:ring-gray-300/80'
    ]"
  >
    <div class="space-y-3">
      <div
        v-if="hasHeader"
        class="flex items-start justify-between gap-3"
      >
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
          <slot name="badge" />
          <h3
            v-if="title"
            class="line-clamp-2 text-base font-semibold text-slate-900"
          >
            {{ title }}
          </h3>
          <p
            v-if="subtitle"
            class="line-clamp-2 text-sm leading-5 text-slate-500"
          >
            {{ subtitle }}
          </p>
        </div>
        <div class="absolute right-4 top-4 ">
          <slot name="actions" />
        </div>
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
