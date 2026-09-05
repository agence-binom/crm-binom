const ALREADY_REGISTERED_ERROR_CODES = new Set(['email_exists', 'user_already_exists'])

export const isAlreadyRegisteredAuthError = (error: { code?: string, message?: string } | null | undefined) => {
  if (!error) return false
  if (error.code && ALREADY_REGISTERED_ERROR_CODES.has(error.code)) return true
  return Boolean(error.message?.toLowerCase().includes('already been registered'))
}
