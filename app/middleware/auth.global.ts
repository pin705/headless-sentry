export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  // Danh sách các trang công khai (không cần đăng nhập)
  const publicPages = ['/login', '/register']

  if (!loggedIn.value) {
    if (!publicPages.includes(to.path)) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath // Lưu lại trang muốn truy cập
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
