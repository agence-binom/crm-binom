<script setup lang="ts">
import { formatFileSize } from '~/lib/utils'

const props = defineProps<{
  modelValue: File[]
  accept: string
  maxSizeBytes: number
  maxSizeLabel: string
  locked?: boolean
  lockedFilename?: string | null
  lockedFileSize?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)

const addFiles = (files: FileList | File[]) => {
  const accepted: File[] = []
  const rejected: string[] = []

  for (const file of files) {
    if (file.size > props.maxSizeBytes) {
      rejected.push(file.name)
      continue
    }
    accepted.push(file)
  }

  if (rejected.length) {
    toast.add({
      title: rejected.length > 1 ? 'Fichiers refusés' : 'Fichier refusé',
      description: `${rejected.join(', ')} : dépasse la taille maximale autorisée de ${props.maxSizeLabel}.`,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  }

  if (accepted.length) {
    emit('update:modelValue', [...props.modelValue, ...accepted])
  }
}

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) addFiles(target.files)
  target.value = ''
}

const onDrop = (event: DragEvent) => {
  isDragOver.value = false
  if (event.dataTransfer?.files.length) addFiles(event.dataTransfer.files)
}

const removeFile = (index: number) => {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
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
    class="rounded-xl border border-dashed px-4 py-4 transition-colors"
    :class="isDragOver ? 'border-slate-500 bg-slate-100' : 'border-slate-300 bg-slate-50'"
    @dragover.prevent="isDragOver = true"
    @dragenter.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      :accept="accept"
      class="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
      @change="onFileSelected"
    >
    <p class="mt-3 text-xs text-slate-500">
      Formats acceptés : PDF, images, Word, Excel. Taille maximale : {{ maxSizeLabel }}. Glissez-déposez ou sélectionnez plusieurs fichiers à la fois.
    </p>
    <ul
      v-if="modelValue.length"
      class="mt-3 space-y-1.5"
    >
      <li
        v-for="(file, index) in modelValue"
        :key="`${file.name}-${index}`"
        class="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
      >
        <span class="truncate">{{ file.name }} • {{ formatFileSize(file.size) }}</span>
        <button
          type="button"
          class="shrink-0 text-slate-400 hover:text-slate-700"
          aria-label="Retirer ce fichier"
          @click="removeFile(index)"
        >
          <UIcon
            name="i-lucide-x"
            class="size-4"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
