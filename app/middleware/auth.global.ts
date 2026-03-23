export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const session = useSupabaseSession()
  const supabase = useSupabaseClient()
  const authorizedSessionEmail = useState<string | null>('authorized-session-email', () => null)

  const publicPages = ['/login', '/confirm']
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  const getNormalizedUserEmail = () => {
    if (!user.value || typeof user.value !== 'object') {
      return null
    }

    const maybeEmail = Reflect.get(user.value, 'email')
    return typeof maybeEmail === 'string' ? maybeEmail.trim().toLowerCase() : null
  }

  const restoreClientSession = async () => {
    if (import.meta.server || session.value || user.value) {
      return
    }

    const [{ data: sessionData }, { data: claimsData }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getClaims()
    ])

    if (sessionData.session) {
      const { user: _user, ...safeSession } = sessionData.session
      session.value = safeSession
    }

    user.value = claimsData?.claims ?? null
  }

  const verifyAuthorizedSession = async () => {
    try {
      await requestFetch('/api/auth/session')
      authorizedSessionEmail.value = getNormalizedUserEmail()
      return true
    } catch {
      authorizedSessionEmail.value = null

      if (import.meta.client) {
        await supabase.auth.signOut()
      }

      return false
    }
  }

  await restoreClientSession()

  const normalizedEmail = getNormalizedUserEmail()
  const hasHydratedAuthState = Boolean(user.value || session.value)
  const hasValidatedAuthorizedSession = Boolean(
    normalizedEmail
    && authorizedSessionEmail.value === normalizedEmail
  )

  if (publicPages.includes(to.path)) {
    if (!hasHydratedAuthState && !hasValidatedAuthorizedSession) {
      return
    }

    if (hasValidatedAuthorizedSession || await verifyAuthorizedSession()) {
      return navigateTo('/')
    }

    return
  }

  if (hasValidatedAuthorizedSession) {
    return
  }

  if (await verifyAuthorizedSession()) {
    return
  }

  return navigateTo('/login')
})
