import mongoose from 'mongoose'
import type { H3Event } from 'h3'

/**
 * Kiểm tra xem user hiện tại có phải là thành viên của project không.
 * Ném lỗi 403 hoặc 404 nếu không hợp lệ.
 * Trả về project document nếu hợp lệ.
 */
export async function requireProjectMembership(event: H3Event) {
  const session = await getUserSession(event)
  const projectId = getRouterParam(event, 'projectId')

  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError({ statusCode: 400, message: 'Project ID không hợp lệ' })
  }

  const userId = new mongoose.Types.ObjectId(session.user.userId)
  const projectIdObj = new mongoose.Types.ObjectId(projectId)

  // Tìm project và kiểm tra thành viên trong cùng query
  const project = await Project.findOne({
    '_id': projectIdObj,
    'members.userId': userId // Kiểm tra xem userId có trong mảng members không
  }).lean() // Dùng lean() nếu chỉ cần đọc

  if (!project) {
    // Check xem project có tồn tại nhưng user không phải member không
    const projectExists = await Project.exists({ _id: projectIdObj })
    if (projectExists) {
      throw createError({ statusCode: 403, message: 'Bạn không có quyền truy cập Project này' })
    } else {
      throw createError({ statusCode: 404, message: 'Không tìm thấy Project' })
    }
  }

  // Trả về project document để có thể dùng trong API handler (ví dụ: kiểm tra role)
  return project
}

/**
 * (Tùy chọn) Kiểm tra thêm vai trò cụ thể (Owner/Admin)
 */
export function requireProjectRole(project: any, userId: mongoose.Types.ObjectId, roles: Array<'owner' | 'admin'>) {
  const member = project.members.find((m: any) => m.userId.equals(userId))
  if (!member || !roles.includes(member.role)) {
    throw createError({ statusCode: 403, message: `Yêu cầu quyền ${roles.join(' hoặc ')}` })
  }
}
