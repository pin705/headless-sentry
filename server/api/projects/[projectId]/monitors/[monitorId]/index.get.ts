import { validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)

  const monitorId = getRouterParam(event, 'monitorId')
  const projectId = getRouterParam(event, 'projectId')
  validateObjectId(monitorId, 'Monitor ID')

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
