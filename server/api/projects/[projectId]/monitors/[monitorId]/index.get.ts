// server/api/monitors/[id].get.ts
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)

  const monitorId = getRouterParam(event, 'monitorId')
  const projectId = getRouterParam(event, 'projectId')

  if (!monitorId || !mongoose.Types.ObjectId.isValid(monitorId)) {
    throw createError({ statusCode: 400, message: 'Monitor ID không hợp lệ' })
  }

  try {
    // 1. Lấy thông tin chi tiết Monitor
    const monitor = await Monitor.findOne({
      _id: monitorId,
      projectId
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
