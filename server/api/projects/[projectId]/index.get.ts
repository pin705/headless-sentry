// server/api/projects/[projectId].get.ts
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const projectId = getRouterParam(event, 'projectId')

  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError({ statusCode: 400, message: 'Project ID không hợp lệ' })
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user.userId)
    const projectIdObj = new mongoose.Types.ObjectId(projectId)

    // Tìm project theo ID
    const project = await Project.findById(projectIdObj)
      // Populate thông tin chi tiết owner (tùy chọn)
      // .populate('ownerId', 'email avatar')
      .lean()

    if (!project) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy Project' })
    }

    // Kiểm tra quyền: User có phải là thành viên không?
    const isMember = project.members.some(member => member.userId.equals(userId))
    if (!isMember) {
      throw createError({ statusCode: 403, message: 'Bạn không có quyền truy cập Project này' })
    }

    return project
  } catch (error: any) {
    console.error(`Lỗi lấy chi tiết project ${projectId}:`, error)
    if (error.statusCode === 404 || error.statusCode === 403) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
