// server/api/dashboard/stats.get.ts
import mongoose from 'mongoose'
import { subDays } from 'date-fns'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  const userId = new mongoose.Types.ObjectId(session.user.userId)
  const now = new Date()
  const date24hAgo = subDays(now, 1) // Lấy mốc 24 giờ trước

  try {
    // === 1. Lấy trạng thái MỚI NHẤT của TẤT CẢ monitors ===
    // (Tái sử dụng logic từ API /api/monitors/index.get.ts)
    const latestStatesPromise = Monitor.aggregate([
      { $match: { userId: userId } },
      { $lookup: {
        from: 'results',
        let: { monitorId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$meta.monitorId', '$$monitorId'] } } },
          { $sort: { timestamp: -1 } },
          { $limit: 1 }
        ],
        as: 'latestResult'
      } },
      { $unwind: { path: '$latestResult', preserveNullAndEmptyArrays: true } },
      { $project: {
        status: 1, // ACTIVE or PAUSED
        isUp: '$latestResult.isUp' // true, false, or null
      } }
    ])

    // === 2. Lấy % Uptime và Latency trung bình trong 24h qua ===
    const stats24hPromise = Result.aggregate([
      { $match: {
        // Chỉ lấy kết quả của user này VÀ trong 24h qua
        'meta.userId': userId,
        'timestamp': { $gte: date24hAgo }
      } },
      { $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        totalUp: { $sum: { $cond: ['$isUp', 1, 0] } },
        avgLatency: { $avg: '$latency' }
      } }
    ])

    // Chạy song song
    const [latestStates, stats24hArr] = await Promise.all([
      latestStatesPromise,
      stats24hPromise
    ])

    // === 3. Xử lý dữ liệu ===

    // Xử lý Stats 24h
    const stats24h = stats24hArr[0] || { totalChecks: 0, totalUp: 0, avgLatency: 0 }
    const uptimePercent24h = (stats24h.totalChecks > 0)
      ? (stats24h.totalUp / stats24h.totalChecks) * 100
      : 100 // Mặc định là 100% nếu không có dữ liệu

    // Xử lý Trạng thái mới nhất
    let totalMonitors = 0
    let totalUp = 0
    let totalDown = 0
    let totalPaused = 0

    latestStates.forEach((monitor) => {
      totalMonitors++
      if (monitor.status === 'PAUSED') {
        totalPaused++
      } else if (monitor.isUp === true) {
        totalUp++
      } else {
        // Bao gồm null (chưa chạy) và false (down)
        totalDown++
      }
    })

    return {
      totalMonitors,
      totalUp,
      totalDown,
      totalPaused,
      uptimePercent24h: parseFloat(uptimePercent24h.toFixed(2)),
      avgLatency24h: Math.round(stats24h.avgLatency)
    }
  } catch (error: any) {
    console.error('Lỗi lấy stats dashboard:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
