export function useCopyToClipboard() {
  const { showError, showSuccess } = useFeedbackToast()

  const copy = async (text: string, successMessage = 'Copié dans le presse-papiers') => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Lien copié', successMessage)
    } catch (error) {
      showError('Copie impossible', error, 'Le navigateur a refusé l’accès au presse-papiers : copiez le lien à la main.')
    }
  }

  return { copy }
}
