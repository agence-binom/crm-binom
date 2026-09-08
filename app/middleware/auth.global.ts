import { authClient } from '~/lib/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const session = authClient.useSession()
  const authorizedSessionEmail = useState<string | null>('authorized-session-email', () => null)
  const portalSessionEmail = useState<string | null>('portal-session-email', () => null)

  const publicPages = ['/login', '/confirm']
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  const isPortalPage = (path: string) => path === '/espace-client' || path.startsWith('/espace-client/')

  const getNormalizedUserEmail = () => {
    const email = session.value.data?.user?.email
    return typeof email === 'string' ? email.trim().toLowerCase() : null
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
      await authClient.signOut()
    }

    return navigateTo('/login')
  }

  const normalizedEmail = getNormalizedUserEmail()
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
