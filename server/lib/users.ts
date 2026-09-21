// Créer/modifier/supprimer un utilisateur staff est une action d'administration : un employé peut
// gérer les clients/projets au quotidien, mais pas la liste des comptes qui ont accès à l'app,
// même logique que canManagePortalAccess dans server/lib/client-portal.ts.
export const canManageUsers = (role: string | null | undefined) => role === 'admin'
