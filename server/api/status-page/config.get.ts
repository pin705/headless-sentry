// server/api/status-page/config.get.ts
import mongoose from 'mongoose'

// (Mới) Định nghĩa kiểu dữ liệu trả về và giá trị mặc định
const defaultStatusPageConfig = {
  isEnabled: false,
  slug: null,
  title: 'Trạng thái Dịch vụ',
  logoUrl: null
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user.userId)

    // Tìm người dùng và chỉ lấy trường statusPage
    const user = await User.findById(userId)
      .select('statusPage') // Chỉ lấy field statusPage
      .lean() // Chuyển sang plain object

    if (!user) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy người dùng' })
    }

    // Trả về cấu hình statusPage hoặc giá trị mặc định nếu chưa có
    return {
      ...defaultStatusPageConfig, // Đảm bảo mọi trường đều có
      ...(user.statusPage || {}) // Ghi đè bằng dữ liệu thực tế (nếu có)
    }

  } catch (error: any) {
    console.error('Lỗi lấy config status page:', error)
    if (error.statusCode === 404) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
