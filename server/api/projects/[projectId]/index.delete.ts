import { getRequireUserSession, validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId } = await getRequireUserSession(event)
  const projectId = getRouterParam(event, 'projectId')
  const projectIdObj = validateObjectId(projectId, 'Project ID')

  try {
    const project = await Project.findById(projectIdObj)

    if (!project) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy Project' })
    }

    if (!project.ownerId.equals(userId)) {
      throw createError({ statusCode: 403, message: 'Chỉ chủ sở hữu mới có quyền xóa Project' })
    }

    const monitorDeletionPromise = Monitor.deleteMany({ projectId: projectIdObj })

    const resultDeletionPromise = Result.deleteMany({ 'meta.projectId': projectIdObj })

    const projectDeletionPromise = Project.deleteOne({ _id: projectIdObj })

    const userUpdatePromise = User.updateMany(
      { _id: { $in: project.members.map(m => m.userId) } },
      { $pull: { projectIds: projectIdObj } }
    )

    // Chạy song song các thao tác xóa
    await Promise.all([
      monitorDeletionPromise,
      resultDeletionPromise, // Cẩn thận với tác vụ này
      projectDeletionPromise,
      userUpdatePromise
    ])

    return { success: true, message: 'Đã xóa Project và các dữ liệu liên quan.' }
  } catch (error: any) {
    console.error(`Lỗi xóa project ${projectId}:`, error)
    if (error.statusCode === 404 || error.statusCode === 403) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ khi xóa Project' })
  }
})
