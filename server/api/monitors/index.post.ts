// server/api/monitors.post.ts
import { z } from 'zod'

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const frequencies = [60, 300, 600, 1800, 3600] as const

const bodySchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  endpoint: z.string().url('URL không hợp lệ'),
  method: z.enum(httpMethods).default('GET'),
  frequency: z.number().refine(val => frequencies.includes(val as 60), 'Tần suất không hợp lệ').default(60)
  // Thêm httpConfig validation nếu cần
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
      method: body.method,
      frequency: body.frequency,
      status: 'ACTIVE',
    })

    return newMonitor.toObject()
  } catch (error: any) {
    if (error.issues) { // Lỗi validation từ Zod
      throw createError({ statusCode: 400, message: error.issues[0].message })
    }
    console.error('Lỗi tạo monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
