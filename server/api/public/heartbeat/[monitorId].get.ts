export default defineEventHandler(async (event) => {
  const monitorId = getRouterParam(event, 'monitorId')

  if (!monitorId) {
    throw createError({ statusCode: 400, message: 'monitorId không hợp lệ' })
  }

  try {
    // Tìm monitor
    const monitor = await Monitor.findById(monitorId).lean()

    if (!monitor) {
      throw createError({ statusCode: 404, message: 'Monitor không tồn tại' })
    }

    // Kiểm tra loại monitor
    if (monitor.type !== 'heartbeat') {
      throw createError({ statusCode: 400, message: 'Monitor này không phải loại heartbeat' })
    }

    // Cập nhật lastHeartbeat
    await Monitor.findByIdAndUpdate(monitorId, {
      $set: { lastHeartbeat: new Date() }
    })

    return {
      success: true,
      message: 'Heartbeat received',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Lỗi khi nhận heartbeat:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
