import { getErrorMessage } from '~/lib/utils'

export function useFeedbackToast() {
  const toast = useToast()

  const showError = (title: string, error: unknown, fallback: string) => {
    toast.add({
      title,
      description: getErrorMessage(error, fallback),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  }

  const showSuccess = (title: string, description: string) => {
    toast.add({
      title,
      description,
      color: 'primary',
      icon: 'i-lucide-check-circle'
    })
  }

  const showInfo = (title: string, description: string) => {
    toast.add({
      title,
      description,
      color: 'info',
      icon: 'i-lucide-info'
    })
  }

  return {
    showError,
    showSuccess,
    showInfo
  }
}
