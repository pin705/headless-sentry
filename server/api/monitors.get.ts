// server/api/monitors.get.ts
// Import Result model để lấy status gần nhất (nếu muốn)
// import { Result } from '~/server/models/result.model'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const monitors = await Monitor.find({ userId: session.user.userId }).lean()

    // Nâng cao: Lấy thêm status/latency gần nhất cho mỗi monitor
    // const monitorIds = monitors.map(m => m._id);
    // const latestResults = await Result.aggregate([ ... complex query ... ]);
    // Sau đó join dữ liệu vào `monitors`

    return monitors
  } catch (error) {
    console.error('Lỗi lấy danh sách monitor:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ khi lấy danh sách monitor' })
  }
})
