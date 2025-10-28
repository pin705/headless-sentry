export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  const publicPages = ['/login', '/register']

  if (!loggedIn.value) {
    if (!publicPages.includes(to.path)) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      })
    }

    return
  }

  if (loggedIn.value) {
    if (publicPages.includes(to.path)) {
      return navigateTo('/')
    }

    return
  }
})
