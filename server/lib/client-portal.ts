const ALREADY_REGISTERED_ERROR_CODES = new Set(['email_exists', 'user_already_exists'])

export const isAlreadyRegisteredAuthError = (error: { code?: string, message?: string } | null | undefined) => {
  if (!error) return false
  if (error.code && ALREADY_REGISTERED_ERROR_CODES.has(error.code)) return true
  return Boolean(error.message?.toLowerCase().includes('already been registered'))
}

// Seuls les admins peuvent donner ou révoquer l'accès portail d'un contact (voir issue #101) :
// un employé gère déjà les contacts au quotidien, mais l'accès à l'espace client d'un client est
// jugé plus sensible et réservé aux admins.
export const canManagePortalAccess = (role: string | null | undefined) => role === 'admin'
