import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  await requireProjectMembership(event)

  try {
    const projectId = getRouterParam(event, 'projectId') // Lấy projectId
    const monitorsWithStatus = await Monitor.aggregate([
      // 1. Lọc monitor của user hiện tại
      { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },

      // 2. Sắp xếp (tùy chọn, ví dụ: theo tên)
      { $sort: { name: 1 } },

      // 3. Tra cứu (lookup) kết quả mới nhất từ collection 'results'
      {
        $lookup: {
          from: 'results', // Tên collection 'results'
          let: { monitorId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$meta.monitorId', '$$monitorId'] } } },
            { $sort: { timestamp: -1 } }, // Sắp xếp giảm dần để lấy mới nhất
            { $limit: 1 } // Chỉ lấy 1
          ],
          as: 'latestResult' // Tên mảng kết quả
        }
      },

      // 4. Chuyển mảng (1-phần-tử) thành object
      {
        $unwind: {
          path: '$latestResult',
          preserveNullAndEmptyArrays: true // Giữ lại monitor dù chưa có kết quả
        }
      },

      // 5. Định hình (project) dữ liệu trả về cho client
      {
        $project: {
          // Lấy tất cả các trường của Monitor
          _id: 1,
          name: 1,
          endpoint: 1,
          status: 1, // Trạng thái ACTIVE/PAUSED
          method: 1,
          frequency: 1,
          createdAt: 1,

          // Thêm các trường từ 'latestResult'
          latestStatus: { $cond: { if: '$latestResult.isUp', then: 'UP', else: { $cond: { if: '$latestResult', then: 'DOWN', else: 'N/A' } } } },
          latestLatency: '$latestResult.latency',
          latestCheckedAt: '$latestResult.timestamp',
          latestStatusCode: '$latestResult.statusCode',

          ssl: 1,
          httpConfig: 1,
          alertConfig: 1,
          isPublic: 1
        }
      }
    ])

    return monitorsWithStatus
  } catch (error) {
    console.error('Lỗi lấy danh sách monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
