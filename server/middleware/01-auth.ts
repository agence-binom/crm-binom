import { createError, getRequestURL } from 'h3'
import { toPublicDatabaseError } from '../utils/database-errors'
import { isPublicAuthApiPath, requireAuthorizedAppUserByEmail, requireBetterAuthSession } from '../utils/auth'
import { requireActivePortalContactWithClient } from '../utils/client-portal'
import { requireExternalApiSecret } from '../utils/external-api'

// Toute route /api/portal/* est traitée ici plutôt que déléguée à chaque handler : ça garantit
// qu'un futur endpoint portail (projets, documents...) ne peut pas être ajouté sans vérification
// d'accès par oubli (voir issue #101). Le contact et son client sont résolus une seule fois et
// exposés via event.context, les handlers n'ont plus à refaire la requête.
const PORTAL_API_PREFIX = '/api/portal/'

// Appels serveur-à-serveur du site public (brief pré-rendez-vous) : pas de session, un secret
// partagé. Même logique que le portail - vérifié ici une fois pour toutes, pour qu'aucun endpoint
// ajouté sous ce préfixe ne puisse être exposé sans. Ne pas réutiliser ce préfixe pour un autre
// appelant sans lui donner son propre secret.
const EXTERNAL_API_PREFIX = '/api/external/'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api')) return
  if (isPublicAuthApiPath(path)) return

  if (path.startsWith(EXTERNAL_API_PREFIX)) {
    requireExternalApiSecret(event)
    return
  }

  const session = await requireBetterAuthSession(event)
  const email = session.user.email
  if (!email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    if (path.startsWith(PORTAL_API_PREFIX)) {
      const { contact, client } = await requireActivePortalContactWithClient(email)
      event.context.portalContact = contact
      event.context.portalClient = client
      return
    }

    event.context.appUser = await requireAuthorizedAppUserByEmail(email)
  } catch (error) {
    throw toPublicDatabaseError(error)
  }
})
