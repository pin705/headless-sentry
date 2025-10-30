import mongoose from 'mongoose'

// (Mới) Định nghĩa kiểu dữ liệu trả về và giá trị mặc định
const defaultStatusPageConfig = {
  isEnabled: false,
  slug: null,
  title: 'Trạng thái Dịch vụ',
  logoUrl: null
}

export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)
  const projectId = getRouterParam(event, 'projectId')

  try {
    const projectIdObjectId = new mongoose.Types.ObjectId(projectId)

    // Tìm người dùng và chỉ lấy trường statusPage
    const project = await Project.findById(projectIdObjectId)
      .select('statusPage') // Chỉ lấy field statusPage
      .lean() // Chuyển sang plain object

    if (!project) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy người dùng' })
    }

    // Trả về cấu hình statusPage hoặc giá trị mặc định nếu chưa có
    return {
      ...defaultStatusPageConfig, // Đảm bảo mọi trường đều có
      ...(project.statusPage || {}) // Ghi đè bằng dữ liệu thực tế (nếu có)
    }
  } catch (error) {
    console.error('Lỗi lấy config status page:', error)
    if (error.statusCode === 404) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
