export function useDeleteConfirmation() {
  const toast = useToast()

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

      toast.add({
        title: 'Suppression réussie',
        description: `Le ${resourceName} a été supprimé avec succès`,
        color: 'primary',
        icon: 'i-lucide-check-circle'
      })

      if (onSuccess) {
        await onSuccess()
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du ${resourceName}:`, error)
      toast.add({
        title: 'Erreur',
        description: `Impossible de supprimer le ${resourceName}`,
        color: 'error',
        icon: 'i-lucide-x-circle'
      })
      throw error
    }
  }

  return {
    deleteResource
  }
}
