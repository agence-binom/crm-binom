// Seuls les admins peuvent donner ou révoquer l'accès portail d'un contact (voir issue #101) :
// un employé gère déjà les contacts au quotidien, mais l'accès à l'espace client d'un client est
// jugé plus sensible et réservé aux admins.
export const canManagePortalAccess = (role: string | null | undefined) => role === 'admin'
