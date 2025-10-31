import { z } from 'zod'
import { getRequireUserSession, handleValidationError } from '~~/server/utils/validation'

const bodySchema = z.object({
  name: z.string().min(1, 'Tên Project không được để trống').max(100, 'Tên Project quá dài'),
})

export default defineEventHandler(async (event) => {
  const { session, userId } = await getRequireUserSession(event)
  if (!session.user?.email) {
    throw createError({ statusCode: 401, message: 'Email không hợp lệ' })
  }

  try {
    const body = await readValidatedBody(event, bodySchema.parse)

    // Tạo Project mới
    const newProject = await Project.create({
      name: body.name,
      ownerId: userId,
      members: [{ // Tự động thêm owner vào danh sách members
        userId: userId,
        email: session.user.email, // Lấy email từ session
        role: 'owner'
      }],
      // Cấu hình statusPage sẽ lấy giá trị mặc định từ model
    })

    // (Tùy chọn) Cập nhật lại danh sách projectIds của User (nếu bạn dùng)
    // await User.findByIdAndUpdate(userId, { $addToSet: { projectIds: newProject._id } });

    return newProject.toObject()

  } catch (error) {
    handleValidationError(error)
    console.error('Lỗi tạo project:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
