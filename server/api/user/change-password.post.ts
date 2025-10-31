import { z } from 'zod'

// Validation schema
const schema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'Mật khẩu mới phải khác mật khẩu cũ',
  path: ['newPassword']
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  const body = await readValidatedBody(event, schema.safeParse)

  if (!body.success) {
    throw createError({ statusCode: 400, message: body.error.errors[0].message })
  }

  const { currentPassword, newPassword } = body.data

  // 1. Lấy user từ DB (bao gồm cả trường password)
  const user = await User.findById(session.user.userId).select('+password')
  if (!user || !user.password) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy người dùng hoặc tài khoản không có mật khẩu' })
  }

  // 2. Xác thực mật khẩu hiện tại
  const isPasswordCorrect = await verifyPassword(currentPassword, user.password)
  if (!isPasswordCorrect) {
    throw createError({ statusCode: 403, message: 'Mật khẩu hiện tại không đúng' })
  }

  // 3. Hash mật khẩu mới
  const hashedNewPassword = await hashPassword(newPassword)

  // 4. Cập nhật mật khẩu
  user.password = hashedNewPassword
  await user.save()

  return { success: true, message: 'Đổi mật khẩu thành công' }
})
