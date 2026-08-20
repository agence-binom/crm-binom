export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getFileTypeIcon = (mimetype?: string | null) => {
  if (!mimetype) return 'i-lucide-file'
  if (mimetype.includes('pdf')) return 'i-lucide-file-text'
  if (mimetype.includes('image')) return 'i-lucide-image'
  if (mimetype.includes('word') || mimetype.includes('document')) return 'i-lucide-file-text'
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'i-lucide-file-spreadsheet'
  return 'i-lucide-file'
}

export const formatDateOnly = (date: string | Date | null | undefined) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Known Supabase Auth and Storage messages are translated; unknown messages are preserved.
const SUPABASE_ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/^signups not allowed for otp$/i, 'Cette adresse email n\'est pas autorisée à se connecter.'],
  [/^email rate limit exceeded$/i, 'Trop de tentatives. Merci de réessayer dans quelques minutes.'],
  [/^for security purposes, you can only request this after \d+ seconds\.?$/i, 'Pour des raisons de sécurité, merci de patienter avant de redemander un lien de connexion.'],
  [/^token has expired or is invalid$/i, 'Ce lien de connexion a expiré ou est invalide.'],
  [/^invalid flow state, no valid flow state found$/i, 'Ce lien de connexion a expiré ou a déjà été utilisé.'],
  [/^auth session missing!?$/i, 'Votre session a expiré, merci de vous reconnecter.'],
  [/^invalid refresh token/i, 'Votre session a expiré, merci de vous reconnecter.'],
  [/^user not found$/i, 'Aucun compte ne correspond à cette adresse email.'],
  [/^email not confirmed$/i, 'Cette adresse email n\'a pas été confirmée.'],
  [/^invalid login credentials$/i, 'Identifiants incorrects.'],
  [/^the resource already exists$/i, 'Un fichier du même nom existe déjà.'],
  [/^(the resource was not found|object not found)$/i, 'Fichier introuvable.'],
  [/^new row violates row-level security policy/i, 'Accès refusé à ce fichier.'],
  [/^the object exceeded the maximum allowed size/i, 'Le fichier dépasse la taille maximale autorisée.']
]

export const translateSupabaseError = (message: string): string | undefined => {
  const trimmed = message.trim()
  return SUPABASE_ERROR_TRANSLATIONS.find(([pattern]) => pattern.test(trimmed))?.[1]
}

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const maybeStatusMessage = Reflect.get(error, 'statusMessage')
    if (typeof maybeStatusMessage === 'string' && maybeStatusMessage) {
      return maybeStatusMessage
    }

    const maybeData = Reflect.get(error, 'data')
    if (maybeData && typeof maybeData === 'object') {
      const dataStatusMessage = Reflect.get(maybeData, 'statusMessage')
      if (typeof dataStatusMessage === 'string' && dataStatusMessage) {
        return dataStatusMessage
      }
    }
  }

  if (error instanceof Error && error.message) {
    return translateSupabaseError(error.message) ?? error.message
  }

  return fallback
}
