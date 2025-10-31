import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên quá dài'),
  avatarUrl: z.string().url('URL avatar không hợp lệ').optional(),
  removeAvatar: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  // 1. Dùng session helper chuẩn (không dùng getRequireUserSession)
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const body = await readValidatedBody(event, schema.safeParse)

    if (!body.success) {
      throw createError({ statusCode: 400, message: body.error.errors[0].message })
    }

    const { name, avatarUrl, removeAvatar } = body.data

    // 2. Xây dựng câu lệnh update linh hoạt
    const updateQuery: any = { $set: { name: name } }

    if (removeAvatar) {
      updateQuery.$set.avatarUrl = null // Nếu cờ remove=true, set avatar là null
    } else if (avatarUrl) {
      updateQuery.$set.avatarUrl = avatarUrl // Nếu có URL mới, set URL đó
    }
    // Nếu không có cả 2, chỉ cập nhật tên

    // 3. Tìm và cập nhật user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.userId,
      updateQuery,
      { new: true } // Trả về document đã cập nhật
    ).select('userId name email avatarUrl') // <-- Thêm avatarUrl

    if (!updatedUser) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy người dùng' })
    }

    // 4. Cập nhật lại session (dùng session.update)
    await replaceUserSession(event, {
      user: {
        ...session.user,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl // <-- Cập nhật avatarUrl trong session
      }
    })

    return updatedUser
  } catch (error: any) {
    // Xử lý lỗi validation nếu readValidatedBody ném ra
    if (error.statusCode === 400) {
      throw error
    }
    console.error('Lỗi server /api/user/profile.put:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
