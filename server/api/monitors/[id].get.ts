// server/api/monitors/[id].get.ts
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const monitorId = getRouterParam(event, 'id')

  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }
  if (!monitorId || !mongoose.Types.ObjectId.isValid(monitorId)) {
    throw createError({ statusCode: 400, message: 'Monitor ID không hợp lệ' })
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user.userId)

    // 1. Lấy thông tin chi tiết Monitor
    const monitor = await Monitor.findOne({
      _id: monitorId,
      userId: userId
    }).lean()

    if (!monitor) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy' })
    }

    // Chỉ trả về monitor
    return monitor

  } catch (error: any) {
    console.error('Lỗi lấy chi tiết monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
