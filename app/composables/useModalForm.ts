import type { UnwrapRef } from 'vue'

export function useModalForm<T extends Record<string, unknown>>(
  props: { open: boolean, id?: number | null, data?: T | null },
  emit: (event: 'update:open' | 'saved', ...args: unknown[]) => void,
  defaultFormState: T,
  fillFromData: (data: T, formState: UnwrapRef<T>) => void
) {
  const isOpen = computed({
    get: () => props.open,
    set: value => emit('update:open', value)
  })

  const isSaving = ref(false)
  const isEditing = computed(() => props.id != null)

  const formState = reactive({ ...defaultFormState }) as UnwrapRef<T>

  const resetForm = () => {
    Object.assign(formState as object, defaultFormState)
  }

  watch(
    () => props.open,
    (open) => {
      if (!open) return
      if (isEditing.value && props.data) {
        fillFromData(props.data, formState)
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  watch(
    () => props.data,
    (data) => {
      if (!props.open || !isEditing.value || !data) return
      fillFromData(data, formState)
    }
  )

  return {
    isOpen,
    isSaving,
    isEditing,
    formState,
    resetForm
  }
}
