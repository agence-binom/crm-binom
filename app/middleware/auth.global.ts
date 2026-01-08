export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  const publicPages = ['/login', '/confirm']

  if (!user.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  if (user.value && publicPages.includes(to.path)) {
    return navigateTo('/')
  }
})
