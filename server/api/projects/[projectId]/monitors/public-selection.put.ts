import { z } from 'zod'
import mongoose from 'mongoose'

// Schema validation cho input body
const bodySchema = z.object({
  // Mảng các ID (_id) của monitor được chọn là public
  selectedIds: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Một hoặc nhiều ID không hợp lệ'
  })).default([])
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const body = await readValidatedBody(event, bodySchema.parse)
    const userId = new mongoose.Types.ObjectId(session.user.userId)
    const projectId = getRouterParam(event, 'projectId')

    // Chuyển đổi mảng string IDs thành mảng ObjectId
    const selectedObjectIds = body.selectedIds.map(id => new mongoose.Types.ObjectId(id))

    // Thực hiện 2 thao tác cập nhật (có thể gộp vào 1 transaction nếu cần)

    // 1. Đặt isPublic = true cho các monitor được chọn
    const updateSelectedPromise = Monitor.updateMany(
      {
        _id: { $in: selectedObjectIds }, // ID nằm trong danh sách chọn
        projectId: projectId // Thuộc user này
      },
      { $set: { isPublic: true } }
    )

    // 2. Đặt isPublic = false cho các monitor KHÔNG được chọn
    const updateUnselectedPromise = Monitor.updateMany(
      {
        _id: { $nin: selectedObjectIds }, // ID KHÔNG nằm trong danh sách chọn
        projectId: projectId // Thuộc user này
      },
      { $set: { isPublic: false } }
    )

    // Chạy song song 2 thao tác
    await Promise.all([
      updateSelectedPromise,
      updateUnselectedPromise
    ])

    return { success: true }
  } catch (error: any) {
    if (error.issues) { // Lỗi Zod
      throw createError({ statusCode: 400, message: error.issues[0].message })
    }
    console.error('Lỗi cập nhật public selection:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
