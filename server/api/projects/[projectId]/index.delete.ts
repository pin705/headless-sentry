// server/api/projects/[projectId].delete.ts
import mongoose from 'mongoose'
import { requireUserSession, validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId } = await requireUserSession(event)
  const projectId = getRouterParam(event, 'projectId')
  const projectIdObj = validateObjectId(projectId, 'Project ID')

  const sessionDB = await mongoose.startSession() // Dùng Transaction để đảm bảo an toàn
  sessionDB.startTransaction()

  try {
    // Tìm project
    const project = await Project.findById(projectIdObj).session(sessionDB)

    if (!project) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy Project' })
    }

    // Kiểm tra quyền: User có phải là owner không?
    if (!project.ownerId.equals(userId)) {
      throw createError({ statusCode: 403, message: 'Chỉ chủ sở hữu mới có quyền xóa Project' })
    }

    // --- Thực hiện xóa (trong transaction) ---
    // 1. Xóa tất cả Monitors thuộc Project này
    const monitorDeletionPromise = Monitor.deleteMany({ projectId: projectIdObj }).session(sessionDB)

    // 2. Xóa tất cả Results thuộc Project này
    // Lưu ý: Việc này có thể rất tốn tài nguyên nếu có nhiều results.
    // Cân nhắc chạy nền hoặc chỉ xóa Monitors.
    const resultDeletionPromise = Result.deleteMany({ 'meta.projectId': projectIdObj }).session(sessionDB)

    // 3. Xóa chính Project
    const projectDeletionPromise = Project.deleteOne({ _id: projectIdObj }).session(sessionDB)

    // 4. (Tùy chọn) Xóa projectId khỏi tất cả members
    // const userUpdatePromise = User.updateMany(
    //   { _id: { $in: project.members.map(m => m.userId) } },
    //   { $pull: { projectIds: projectIdObj } }
    // ).session(sessionDB);

    // Chạy song song các thao tác xóa
    await Promise.all([
      monitorDeletionPromise,
      resultDeletionPromise, // Cẩn thận với tác vụ này
      projectDeletionPromise
      // userUpdatePromise
    ])

    // Hoàn tất transaction
    await sessionDB.commitTransaction()

    return { success: true, message: 'Đã xóa Project và các dữ liệu liên quan.' }
  } catch (error: any) {
    // Hủy bỏ transaction nếu có lỗi
    await sessionDB.abortTransaction()

    console.error(`Lỗi xóa project ${projectId}:`, error)
    if (error.statusCode === 404 || error.statusCode === 403) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ khi xóa Project' })
  } finally {
    // Luôn kết thúc session
    await sessionDB.endSession()
  }
})
