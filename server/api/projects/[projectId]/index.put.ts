// server/api/projects/[projectId].put.ts
import { z } from 'zod'
import mongoose from 'mongoose'

const bodySchema = z.object({
  name: z.string().min(1, 'Tên Project không được để trống').max(100, 'Tên Project quá dài')
})

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
    const body = await readValidatedBody(event, bodySchema.parse)
    const userId = new mongoose.Types.ObjectId(session.user.userId)
    const projectIdObj = new mongoose.Types.ObjectId(projectId)

    // Tìm project
    const project = await Project.findById(projectIdObj)

    if (!project) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy Project' })
    }

    // Kiểm tra quyền: User có phải là owner không? (Sau này mở rộng cho admin)
    if (!project.ownerId.equals(userId)) {
      throw createError({ statusCode: 403, message: 'Chỉ chủ sở hữu mới có quyền sửa tên Project' })
    }

    // Cập nhật tên
    project.name = body.name
    await project.save()

    return project.toObject()
  } catch (error: any) {
    if (error.issues) { // Lỗi Zod
      throw createError({ statusCode: 400, message: error.issues[0].message })
    }
    console.error(`Lỗi cập nhật project ${projectId}:`, error)
    if (error.statusCode === 404 || error.statusCode === 403) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
