// server/api/monitors/[id].patch.ts

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const monitorId = getRouterParam(event, 'id')

  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }
  if (!monitorId) {
    throw createError({ statusCode: 400, message: 'Thiếu Monitor ID' })
  }

  try {
    const monitor = await Monitor.findOne({
      _id: monitorId,
      userId: session.user.userId
    })

    if (!monitor) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy' })
    }

    // Chuyển đổi trạng thái
    monitor.status = monitor.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    await monitor.save()

    return { success: true, newStatus: monitor.status }
  } catch (error) {
    console.error('Lỗi cập nhật monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
