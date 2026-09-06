export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const session = useSupabaseSession()
  const supabase = useSupabaseClient()
  const authorizedSessionEmail = useState<string | null>('authorized-session-email', () => null)
  const portalSessionEmail = useState<string | null>('portal-session-email', () => null)

  const publicPages = ['/login', '/confirm']
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  const isPortalPage = (path: string) => path === '/espace-client' || path.startsWith('/espace-client/')

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
      return false
    }
  }

  const verifyPortalSession = async () => {
    try {
      await requestFetch('/api/portal/session')
      portalSessionEmail.value = getNormalizedUserEmail()
      return true
    } catch {
      portalSessionEmail.value = null
      return false
    }
  }

  const signOutAndRedirectToLogin = async () => {
    if (import.meta.client) {
      await supabase.auth.signOut()
    }

    return navigateTo('/login')
  }

  await restoreClientSession()

  const normalizedEmail = getNormalizedUserEmail()
  const hasHydratedAuthState = Boolean(user.value || session.value)
  const hasValidatedAuthorizedSession = Boolean(
    normalizedEmail
    && authorizedSessionEmail.value === normalizedEmail
  )
  const hasValidatedPortalSession = Boolean(
    normalizedEmail
    && portalSessionEmail.value === normalizedEmail
  )
  const isPortalSessionValid = async () => hasValidatedPortalSession || await verifyPortalSession()

  if (publicPages.includes(to.path)) {
    if (!hasHydratedAuthState && !hasValidatedAuthorizedSession && !hasValidatedPortalSession) {
      return
    }

    if (hasValidatedAuthorizedSession || await verifyAuthorizedSession()) {
      return navigateTo('/')
    }

    if (await isPortalSessionValid()) {
      return navigateTo('/espace-client')
    }

    return
  }

  if (isPortalPage(to.path)) {
    if (hasValidatedPortalSession) {
      return
    }

    if (await verifyPortalSession()) {
      return
    }

    return signOutAndRedirectToLogin()
  }

  if (hasValidatedAuthorizedSession) {
    return
  }

  if (await verifyAuthorizedSession()) {
    return
  }

  // Un contact portail qui navigue par erreur vers une page interne est redirigé
  // vers son espace plutôt que déconnecté.
  if (await isPortalSessionValid()) {
    return navigateTo('/espace-client')
  }

  return signOutAndRedirectToLogin()
})
