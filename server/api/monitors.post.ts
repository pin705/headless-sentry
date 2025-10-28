// server/api/monitors.post.ts
import { z } from 'zod'

// Xác thực input từ client
const bodySchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  endpoint: z.string().url('URL không hợp lệ')
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const body = await readValidatedBody(event, bodySchema.parse)

    const newMonitor = await Monitor.create({
      userId: session.user.userId,
      name: body.name,
      endpoint: body.endpoint,
      // Các trường khác sẽ dùng giá trị default trong model
    })

    return newMonitor.toObject() // Trả về object thay vì Mongoose document
  } catch (error: any) {
    if (error.issues) { // Lỗi validation từ Zod
      throw createError({ statusCode: 400, message: error.issues[0].message })
    }
    console.error('Lỗi tạo monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ khi tạo monitor' })
  }
})
