// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn, session } = useUserSession()

  // Nếu chưa đăng nhập, đá về trang auth
  if (!loggedIn.value) {
    // Cho phép truy cập trang auth
    if (to.path === '/login' || to.path === '/register') {
      return
    }
    return navigateTo('/login')
  }

  // Nếu đã đăng nhập, không cho truy cập trang auth nữa
  if (to.path === '/login' || to.path === '/register') {
    return navigateTo('/dashboard')
  }
})
