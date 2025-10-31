// server/api/projects/[projectId].put.ts
import { z } from 'zod'
import mongoose from 'mongoose'
import { requireUserSession, validateObjectId, handleValidationError } from '~~/server/utils/validation'

const bodySchema = z.object({
  name: z.string().min(1, 'Tên Project không được để trống').max(100, 'Tên Project quá dài')
})

export default defineEventHandler(async (event) => {
  const { userId } = await requireUserSession(event)
  const projectId = getRouterParam(event, 'projectId')
  const projectIdObj = validateObjectId(projectId, 'Project ID')

  try {
    const body = await readValidatedBody(event, bodySchema.parse)

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
    handleValidationError(error)
    console.error(`Lỗi cập nhật project ${projectId}:`, error)
    if (error.statusCode === 404 || error.statusCode === 403) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
