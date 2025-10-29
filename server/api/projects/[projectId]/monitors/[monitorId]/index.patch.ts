export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)

  const monitorId = getRouterParam(event, 'monitorId')
  const projectId = getRouterParam(event, 'projectId')
  if (!monitorId) {
    throw createError({ statusCode: 400, message: 'Thiếu Monitor ID' })
  }

  try {
    const monitor = await Monitor.findOne({
      _id: monitorId,
      projectId
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
