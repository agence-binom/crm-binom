export function useDeleteConfirmation() {
  const { showError, showSuccess } = useFeedbackToast()

  const deleteResource = async (
    resourceName: string,
    resourceId: number,
    endpoint: string,
    onSuccess?: () => void | Promise<void>
  ) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce ${resourceName} ?`)) {
      return
    }

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
    deleteResource
  }
}
