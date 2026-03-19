import { authSignInSchema } from '~/validation/auth'
import { findAuthorizedAppUserByEmail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, authSignInSchema.parse)

  const user = await findAuthorizedAppUserByEmail(body.email)

  return {
    authorized: Boolean(user)
  }
})
