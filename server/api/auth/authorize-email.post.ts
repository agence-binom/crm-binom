import { authSignInSchema } from '~/validation/auth'
import { toPublicDatabaseError } from '../../utils/database-errors'
import { findAuthorizedAppUserByEmail } from '../../utils/auth'
import { findActivePortalContactByEmail } from '../../utils/client-portal'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, authSignInSchema.parse)

  try {
    const [appUser, portalContact] = await Promise.all([
      findAuthorizedAppUserByEmail(body.email),
      findActivePortalContactByEmail(body.email)
    ])

    return {
      authorized: Boolean(appUser || portalContact)
    }
  } catch (error) {
    throw toPublicDatabaseError(error)
  }
})
