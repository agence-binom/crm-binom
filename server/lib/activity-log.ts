// Le journal d'activité expose des actions de tous les employés (et des clients) : réservé aux
// admins, même logique que canManagePortalAccess dans server/lib/client-portal.ts.
export const canViewActivityLog = (role: string | null | undefined) => role === 'admin'
