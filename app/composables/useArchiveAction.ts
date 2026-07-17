export function useArchiveAction() {
  const { showError, showSuccess } = useFeedbackToast()

  const setArchived = async (
    resourceName: string,
    resourceId: number,
    endpoint: string,
    archived: boolean,
    onSuccess?: () => void | Promise<void>
  ) => {
    try {
      await $fetch(`${endpoint}/${resourceId}`, {
        method: 'PUT',
        body: { archived }
      })

      showSuccess(
        archived ? 'Archivage réussi' : 'Restauration réussie',
        archived
          ? `Le ${resourceName} a été archivé avec succès`
          : `Le ${resourceName} a été restauré avec succès`
      )

      if (onSuccess) {
        await onSuccess()
      }
    } catch (error) {
      console.error(`Erreur lors de l'archivage du ${resourceName}:`, error)
      showError(
        archived ? 'Archivage impossible' : 'Restauration impossible',
        error,
        archived ? `Impossible d'archiver le ${resourceName}.` : `Impossible de restaurer le ${resourceName}.`
      )
      throw error
    }
  }

  return {
    setArchived
  }
}
