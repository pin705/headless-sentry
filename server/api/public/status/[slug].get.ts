export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Thiếu slug' })
  }

  try {
    // 1. Tìm User (hoặc Org) dựa trên slug VÀ trang phải được bật
    const project = await Project.findOne({
      'statusPage.slug': slug,
      'statusPage.isEnabled': true
    })
    .select('statusPage') // Chỉ lấy config trang trạng thái
    .lean()

    if (!project) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy trang trạng thái' })
    }

    // 2. Lấy trạng thái MỚI NHẤT của các monitor ĐƯỢC ĐÁNH DẤU CÔNG KHAI (isPublic: true)
    //    và thuộc về user này.
    const monitorsStatus = await Monitor.aggregate([
      // Lọc theo userId và isPublic
      { $match: {
          projectId: project._id,
          isPublic: true,
          status: 'ACTIVE' // Chỉ hiển thị monitor đang active
      }},
      // Sắp xếp (ví dụ: theo tên)
      { $sort: { name: 1 } },
      // Lookup kết quả mới nhất
      { $lookup: {
          from: 'results',
          let: { monitorId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$meta.monitorId', '$$monitorId'] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'latestResult'
      }},
      { $unwind: { path: '$latestResult', preserveNullAndEmptyArrays: true } },
      // Chỉ chọn các trường cần thiết cho trang công khai (KHÔNG LẤY ERROR MESSAGE)
      { $project: {
          _id: 1,
          name: 1,
          // Trạng thái đơn giản: UP, DOWN, MAINT (PAUSED), UNKNOWN (null)
          currentStatus: {
             $switch: {
                branches: [
                   { case: { $eq: ['$status', 'PAUSED'] }, then: 'MAINTENANCE' }, // Ưu tiên PAUSED
                   { case: { $eq: ['$latestResult.isUp', true] }, then: 'OPERATIONAL' },
                   { case: { $eq: ['$latestResult.isUp', false] }, then: 'OUTAGE' },
                ],
                default: 'UNKNOWN' // Chưa có kết quả
             }
          },
          // Có thể thêm latency gần nhất nếu muốn
          // latestLatency: '$latestResult.latency'
      }}
    ])

    // 3. Trả về cấu hình trang và danh sách trạng thái monitor
    return {
      config: project.statusPage, // Title, Logo
      monitors: monitorsStatus
    }

  } catch (error: any) {
    console.error(`Lỗi lấy status công khai cho slug ${slug}:`, error)
     if (error.statusCode === 404) throw error
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
