<script setup lang="ts">
type Info = {
  icon: string
  value?: string | null
}

defineProps<{
  title: string
  subtitle?: string | null
  infos?: Info[]
}>()
</script>

<template>
  <div class="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
    <div class="flex flex-1 flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="text-slate-600"
      >
        {{ subtitle }}
      </p>
      <ul
        v-if="infos?.some(i => i.value)"
        class="mt-2 flex gap-2"
      >
        <li
          v-for="(info, i) in infos"
          :key="i"
        >
          <UBadge
            v-if="info.value"
            variant="soft"
            color="neutral"
            class="rounded-full font-medium"
            :icon="info.icon"
          >
            {{ info.value }}
          </UBadge>
        </li>
      </ul>
    </div>

    <slot name="actions" />
  </div>
</template>
