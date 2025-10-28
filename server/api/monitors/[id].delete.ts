
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
    const deleteMonitorResult = await Monitor.deleteOne({
      _id: monitorId,
      userId: session.user.userId
    })

    if (deleteMonitorResult.deletedCount === 0) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy' })
    }

    // Xóa tất cả results liên quan (chạy nền)
    Result.deleteMany({ 'meta.monitorId': monitorId }).exec()

    return { success: true }
  } catch (error) {
    console.error('Lỗi xóa monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
