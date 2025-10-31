export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  const projectIdObj = project._id

  try {
    const windows = await MaintenanceWindow.find({ projectId: projectIdObj })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'email avatarUrl')
      .lean()

    return windows
  } catch (error) {
    console.error('Lỗi lấy danh sách maintenance windows:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
