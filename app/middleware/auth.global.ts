// app/middleware/auth.global.ts

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  // Danh sách các trang công khai (không cần đăng nhập)
  const publicPages = ['/login', '/register']

  // --- 1. XỬ LÝ KHI CHƯA ĐĂNG NHẬP ---
  if (!loggedIn.value) {
    // Nếu trang đang truy cập *không* phải là trang công khai
    if (!publicPages.includes(to.path)) {
      // Chuyển hướng về trang login
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath // Lưu lại trang muốn truy cập
        }
      })
    }

    // Nếu là trang công khai (login/register), cho phép truy cập
    return
  }

  // --- 2. XỬ LÝ KHI ĐÃ ĐĂNG NHẬP ---
  if (loggedIn.value) {
    // Nếu truy cập trang công khai (login/register)
    if (publicPages.includes(to.path)) {
      // Chuyển hướng thẳng về trang chủ (/)
      return navigateTo('/')
    }

    // Nếu truy cập các trang khác (/, /monitoring, ...), cho phép
    return
  }
})
