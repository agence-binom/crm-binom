export function useDeleteConfirmation() {
  const { showError, showSuccess } = useFeedbackToast()

  const confirmModalOpen = ref(false)
  const confirmModalMessage = ref('')
  let resolveConfirm: ((value: boolean) => void) | null = null

  const onConfirm = () => {
    confirmModalOpen.value = false
    resolveConfirm?.(true)
    resolveConfirm = null
  }

  const onCancel = () => {
    confirmModalOpen.value = false
    resolveConfirm?.(false)
    resolveConfirm = null
  }

  const deleteResource = async (
    resourceName: string,
    resourceId: number,
    endpoint: string,
    onSuccess?: () => void | Promise<void>
  ) => {
    confirmModalMessage.value = `Êtes-vous sûr de vouloir supprimer ce ${resourceName} ?`
    confirmModalOpen.value = true

    const confirmed = await new Promise<boolean>((resolve) => {
      resolveConfirm = resolve
    })

    if (!confirmed) return

    try {
      await $fetch(`${endpoint}/${resourceId}`, {
        method: 'DELETE'
      })

      showSuccess('Suppression réussie', `Le ${resourceName} a été supprimé avec succès`)

      if (onSuccess) {
        await onSuccess()
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du ${resourceName}:`, error)
      showError('Suppression impossible', error, `Impossible de supprimer le ${resourceName}.`)
      throw error
    }
  }

  return {
    deleteResource,
    confirmModalOpen,
    confirmModalMessage,
    onConfirm,
    onCancel
  }
}
