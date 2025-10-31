export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)
  const windowId = getRouterParam(event, 'windowId')

  if (!windowId) {
    throw createError({ statusCode: 400, message: 'windowId không hợp lệ' })
  }

  try {
    const deletedWindow = await MaintenanceWindow.findByIdAndDelete(windowId)

    if (!deletedWindow) {
      throw createError({ statusCode: 404, message: 'Maintenance window không tồn tại' })
    }

    return { success: true }
  } catch (error) {
    console.error('Lỗi xóa maintenance window:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
