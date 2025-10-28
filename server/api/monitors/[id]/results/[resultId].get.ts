// server/api/monitors/[id]/results/[resultId].get.ts
import { Result } from '~~/server/models/result.model'
import { Monitor } from '~~/server/models/monitor.model' // Cần populate Monitor
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const monitorId = getRouterParam(event, 'id') // Lấy monitorId từ route
  const resultId = getRouterParam(event, 'resultId') // Lấy resultId từ route

  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }
  if (!monitorId || !mongoose.Types.ObjectId.isValid(monitorId)) {
    throw createError({ statusCode: 400, message: 'Monitor ID không hợp lệ' })
  }
  if (!resultId || !mongoose.Types.ObjectId.isValid(resultId)) {
    throw createError({ statusCode: 400, message: 'Result ID không hợp lệ' })
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user.userId)

    // Tìm bản ghi Result theo ID
    const result = await Result.findById(resultId)
      // Populate thông tin Monitor liên quan
      .populate<{ 'meta.monitorId': typeof Monitor }>({ // Định kiểu rõ ràng cho populate
        path: 'meta.monitorId',
        select: 'name endpoint method userId', // Lấy các trường cần thiết của Monitor
        model: Monitor
      })
      .lean() // Chuyển sang plain object

    // Kiểm tra xem Result có tồn tại và thuộc về user không
    if (!result || !result.meta?.monitorId?.userId?.equals(userId)) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy kết quả kiểm tra' })
    }

    // Kiểm tra xem monitorId trong route có khớp với monitorId của result không (bảo mật)
    if (!result.meta?.monitorId?._id?.equals(monitorId)) {
      throw createError({ statusCode: 400, message: 'ID không khớp' })
    }

    // Đổi tên trường để rõ ràng hơn ở frontend
    const formattedResult = {
      ...result,
      monitor: result.meta.monitorId // Gộp thông tin monitor vào cấp gốc
    }
    delete formattedResult.meta

    return formattedResult
  } catch (error: any) {
    console.error('Lỗi lấy chi tiết kết quả:', error)
    // Trả về lỗi nếu không tìm thấy hoặc lỗi server
    if (error.statusCode === 404 || error.statusCode === 400) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
