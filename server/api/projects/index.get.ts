// server/api/projects/index.get.ts
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user.userId)

    // Tìm các project mà user là thành viên
    const projects = await Project.find({
      'members.userId': userId // Tìm trong mảng members
    })
    // Chỉ lấy các trường cần thiết cho danh sách
      .select('_id name ownerId') // Lấy ID, tên và ID owner
      .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước (tùy chọn)
      .lean() // Chuyển sang plain object

    return projects
  } catch (error: any) {
    console.error('Lỗi lấy danh sách project:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
