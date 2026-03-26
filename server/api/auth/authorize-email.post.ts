import { authSignInSchema } from '~/validation/auth'
import { toPublicDatabaseError } from '../../utils/database-errors'
import { findAuthorizedAppUserByEmail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, authSignInSchema.parse)

  try {
    const user = await findAuthorizedAppUserByEmail(body.email)

    return {
      authorized: Boolean(user)
    }
  } catch (error) {
    throw toPublicDatabaseError(error)
  }
})
