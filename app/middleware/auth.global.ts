export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const authorizedSessionEmail = useState<string | null>('authorized-session-email', () => null)

  const publicPages = ['/login', '/confirm']

  if (!user.value && !publicPages.includes(to.path)) {
    authorizedSessionEmail.value = null
    return navigateTo('/login')
  }

  if (!user.value) {
    authorizedSessionEmail.value = null
    return
  }

  const normalizedEmail = user.value.email?.trim().toLowerCase() ?? null

  if (!publicPages.includes(to.path) && authorizedSessionEmail.value !== normalizedEmail) {
    try {
      await $fetch('/api/auth/session')
      authorizedSessionEmail.value = normalizedEmail
    } catch {
      authorizedSessionEmail.value = null
      await supabase.auth.signOut()
      return navigateTo('/login')
    }
  }

  if (user.value && publicPages.includes(to.path)) {
    return navigateTo('/')
  }
})
