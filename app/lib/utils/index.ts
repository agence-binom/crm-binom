export const sortByCreatedAtDesc = <T extends { createdAt: string | Date }>(items: T[]) => (
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)

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

// Known Better Auth and S3-compatible storage messages are translated; unknown messages are preserved.
// Storage errors are matched as "<AWS SDK error name>: <message>" (see translateStorageError callers) -
// object keys already embed a UUID (buildDocumentStoragePath), so a same-key collision on upload is not
// realistically expected and isn't specially translated.
const AUTH_AND_STORAGE_ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/rate limit/i, 'Trop de tentatives. Merci de réessayer dans quelques minutes.'],
  [/^(token expired|invalid token)$/i, 'Ce lien de connexion a expiré ou est invalide.'],
  [/^session expired\b/i, 'Votre session a expiré, merci de vous reconnecter.'],
  [/^user not found$/i, 'Aucun compte ne correspond à cette adresse email.'],
  [/^email not verified$/i, 'Cette adresse email n\'a pas été confirmée.'],
  [/^invalid email or password$/i, 'Identifiants incorrects.'],
  [/^(NoSuchKey|NoSuchBucket|NotFound):/, 'Fichier introuvable.'],
  [/^AccessDenied:/, 'Accès refusé à ce fichier.'],
  [/^EntityTooLarge:/, 'Le fichier dépasse la taille maximale autorisée.']
]

export const translateStorageError = (message: string): string | undefined => {
  const trimmed = message.trim()
  return AUTH_AND_STORAGE_ERROR_TRANSLATIONS.find(([pattern]) => pattern.test(trimmed))?.[1]
}

// h3's readValidatedBody/getValidatedQuery wrap every failed Zod parse behind the generic
// "Validation Error" statusMessage — the actual field-level message is the ZodError's own
// `.message`, a JSON-stringified array of issues, nested a level or two down depending on how
// the client wraps the response. This pulls it back out so the toast says something useful.
const extractZodIssueMessage = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null

  try {
    const issues = JSON.parse(raw)
    if (!Array.isArray(issues) || issues.length === 0) return null

    const messages = issues
      .map(issue => (issue && typeof issue === 'object' ? Reflect.get(issue, 'message') : null))
      .filter((message): message is string => typeof message === 'string' && message.length > 0)

    return messages.length > 0 ? messages.join(' ') : null
  } catch {
    return null
  }
}

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const maybeData = Reflect.get(error, 'data')
    const dataObject = maybeData && typeof maybeData === 'object' ? maybeData : null
    const nestedData = dataObject ? Reflect.get(dataObject, 'data') : null
    const nestedDataObject = nestedData && typeof nestedData === 'object' ? nestedData : null

    const zodMessage = [
      dataObject ? Reflect.get(dataObject, 'message') : null,
      nestedDataObject ? Reflect.get(nestedDataObject, 'message') : null,
      Reflect.get(error, 'message')
    ].map(extractZodIssueMessage).find((message): message is string => message !== null)
    if (zodMessage) return zodMessage

    const maybeStatusMessage = Reflect.get(error, 'statusMessage')
    if (typeof maybeStatusMessage === 'string' && maybeStatusMessage) {
      return maybeStatusMessage
    }

    if (dataObject) {
      const dataStatusMessage = Reflect.get(dataObject, 'statusMessage')
      if (typeof dataStatusMessage === 'string' && dataStatusMessage) {
        return dataStatusMessage
      }
    }
  }

  if (error instanceof Error && error.message) {
    return translateStorageError(error.message) ?? error.message
  }

  return fallback
}
