import { subHours } from 'date-fns'
import { validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  // Verify user is authenticated (return value not needed here)
  await requireUserSession(event)
  const projectId = getRouterParam(event, 'projectId')
  const projectIdObjectId = validateObjectId(projectId, 'Project ID')

  const now = new Date()
  const date24hAgo = subHours(now, 24) // Mốc 24 giờ trước

  try {
    // === 1. Lấy trạng thái MỚI NHẤT của TẤT CẢ monitors (Giữ nguyên) ===
    const latestStatesPromise = Monitor.aggregate([
      { $match: { projectId: projectIdObjectId } },
      { $lookup: {
        from: 'results', let: { monitorId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$meta.monitorId', '$$monitorId'] } } },
          { $sort: { timestamp: -1 } }, { $limit: 1 }
        ], as: 'latestResult'
      } },
      { $unwind: { path: '$latestResult', preserveNullAndEmptyArrays: true } },
      { $project: { status: 1, isUp: '$latestResult.isUp' } }
    ])

    // === 2. Lấy % Uptime và Latency trung bình trong 24h qua (Giữ nguyên) ===
    const stats24hPromise = Result.aggregate([
      { $match: { 'meta.projectId': projectIdObjectId, 'timestamp': { $gte: date24hAgo } } },
      { $group: {
        _id: null, totalChecks: { $sum: 1 }, totalUp: { $sum: { $cond: ['$isUp', 1, 0] } }, avgLatency: { $avg: '$latency' }
      } }
    ])

    // === (MỚI) 3. Lấy dữ liệu Biểu đồ Latency (Trung bình mỗi giờ trong 24h) ===
    const latencyChartPromise = Result.aggregate([
      { $match: { 'meta.projectId': projectIdObjectId, 'timestamp': { $gte: date24hAgo } } },
      { $group: {
        // Nhóm theo giờ
        _id: { $dateTrunc: { date: '$timestamp', unit: 'hour' } },
        avgLatency: { $avg: '$latency' }
      } },
      { $sort: { _id: 1 } }, // Sắp xếp theo giờ tăng dần
      { $project: { _id: 0, hour: '$_id', avgLatency: { $round: ['$avgLatency', 0] } } } // Làm tròn latency
    ])

    // === (MỚI) 4. Lấy 5 Lỗi Gần Nhất ===
    const recentErrorsPromise = Result.find({
      'meta.projectId': projectIdObjectId,
      'isUp': false, // Chỉ lấy các lần kiểm tra thất bại
      'timestamp': { $gte: date24hAgo } // Chỉ trong 24h
    })
      .sort({ timestamp: -1 }) // Mới nhất trước
      .limit(5)
      .populate({ // Lấy tên Monitor
        path: 'meta.monitorId',
        select: 'name endpoint', // Chỉ lấy tên và endpoint
        model: Monitor // Chỉ định model
      })
      .select('timestamp statusCode errorMessage meta.monitorId') // Chọn các trường cần thiết
      .lean()

    // === (MỚI) 5. Lấy 5 Cảnh báo Gần Nhất (Ước tính) ===
    // Tìm các monitor có lastAlertedAt trong 24h qua
    const recentAlertsPromise = Monitor.find({
      'projectId': projectIdObjectId,
      'alertConfig.lastAlertedAt': { $gte: date24hAgo }
    })
      .sort({ 'alertConfig.lastAlertedAt': -1 }) // Mới nhất trước
      .limit(5)
      .select('name endpoint alertConfig.lastAlertedAt') // Chọn các trường cần thiết
      .lean()

    // Chạy song song tất cả
    const [
      latestStates,
      stats24hArr,
      latencyChartData,
      recentErrors,
      recentAlerts
    ] = await Promise.all([
      latestStatesPromise,
      stats24hPromise,
      latencyChartPromise,
      recentErrorsPromise,
      recentAlertsPromise
    ])

    // === Xử lý dữ liệu (Giữ nguyên phần đầu) ===
    const stats24h = stats24hArr[0] || { totalChecks: 0, totalUp: 0, avgLatency: 0 }
    const uptimePercent24h = (stats24h.totalChecks > 0) ? (stats24h.totalUp / stats24h.totalChecks) * 100 : 100
    let totalMonitors = 0, totalUp = 0, totalDown = 0, totalPaused = 0
    latestStates.forEach((m) => {
      totalMonitors++
      if (m.status === 'PAUSED') totalPaused++
      else if (m.isUp === true) totalUp++
      else totalDown++
    })

    return {
      // Dữ liệu cũ
      totalMonitors, totalUp, totalDown, totalPaused,
      uptimePercent24h: parseFloat(uptimePercent24h.toFixed(2)),
      avgLatency24h: Math.round(stats24h.avgLatency),

      // (MỚI) Dữ liệu mới
      latencyChartData, // Dữ liệu cho biểu đồ latency
      recentErrors, // Danh sách lỗi
      recentAlerts // Danh sách cảnh báo (ước tính)
    }
  } catch (error: any) {
    console.error('Lỗi lấy stats dashboard:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
