import { z } from 'zod'

// Validation schema
const schema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên quá dài')
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

  const { name } = body.data

  // Tìm và cập nhật user
  const updatedUser = await User.findByIdAndUpdate(
    session.user.userId,
    { $set: { name: name } },
    { new: true } // Trả về document đã cập nhật
  ).select('userId name email') // Chỉ lấy các trường public

  if (!updatedUser) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy người dùng' })
  }

  // Cập nhật lại session để tên mới hiển thị ngay lập tức
  await replaceUserSession(event, {
    ...session.user,
    name: updatedUser.name
  })

  return updatedUser
})
