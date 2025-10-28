// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn, session } = useUserSession()

  // Nếu chưa đăng nhập, đá về trang auth
  if (!loggedIn.value) {
    // Cho phép truy cập trang auth
    if (to.path === '/auth') {
      return
    }
    return navigateTo('/auth')
  }

  // Nếu đã đăng nhập nhưng chưa có nhân vật
  if (!session.value?.character && to.path !== '/create-character') {
    return navigateTo('/create-character')
  }

  // Nếu đã có nhân vật nhưng lại vào trang tạo nhân vật
  if (session.value?.character && to.path === '/create-character') {
    return navigateTo('/dashboard')
  }
})
