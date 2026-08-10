<script setup lang="ts">
import { formatFileSize } from '~/lib/utils'

const props = defineProps<{
  modelValue: File | null
  accept: string
  maxSizeBytes: number
  maxSizeLabel: string
  locked?: boolean
  lockedFilename?: string | null
  lockedFileSize?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement>()

watch(() => props.modelValue, (file) => {
  if (!file && fileInput.value) fileInput.value.value = ''
})

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (!file) {
    emit('update:modelValue', null)
    return
  }

  if (file.size > props.maxSizeBytes) {
    emit('update:modelValue', null)
    toast.add({
      title: 'Fichier refusé',
      description: `Le fichier dépasse la taille maximale autorisée de ${props.maxSizeLabel}.`,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  emit('update:modelValue', file)
}
</script>

<template>
  <div
    v-if="locked"
    class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
  >
    {{ lockedFilename }} • {{ formatFileSize(lockedFileSize || 0) }}
    <p class="mt-1 text-xs text-slate-400">
      Le fichier ne peut pas être modifié après l'ajout.
    </p>
  </div>

  <div
    v-else
    class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
      @change="onFileSelected"
    >
    <p class="mt-3 text-xs text-slate-500">
      Formats acceptés : PDF, images, Word, Excel. Taille maximale : {{ maxSizeLabel }}.
    </p>
    <p
      v-if="modelValue"
      class="mt-2 text-sm font-medium text-slate-700"
    >
      {{ modelValue.name }}
    </p>
  </div>
</template>
