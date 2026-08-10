<script setup lang="ts" generic="T extends string">
const props = defineProps<{
  options: { label: string, value: T, icon: string }[]
  modelValue: T
  locked?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()

const selectedOption = computed(() => props.options.find(option => option.value === props.modelValue))
</script>

<template>
  <div
    v-if="locked"
    class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
  >
    <UIcon
      v-if="selectedOption"
      :name="selectedOption.icon"
    />
    {{ selectedOption?.label }}
  </div>

  <div
    v-else
    class="flex flex-wrap gap-2"
  >
    <UButton
      v-for="option in options"
      :key="option.value"
      type="button"
      variant="soft"
      color="neutral"
      :class="[
        'rounded-full px-3.5 transition-colors',
        modelValue === option.value
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-200/70'
      ]"
      @click="$emit('update:modelValue', option.value)"
    >
      <UIcon
        :name="option.icon"
        class="mr-1"
      />
      {{ option.label }}
    </UButton>
  </div>
</template>
