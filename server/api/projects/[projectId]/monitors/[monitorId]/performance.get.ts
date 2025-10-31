export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  const monitorId = getRouterParam(event, 'monitorId')

  if (!monitorId) {
    throw createError({ statusCode: 400, message: 'monitorId không hợp lệ' })
  }

  // Lấy tham số query: hours (mặc định 24 giờ)
  const query = getQuery(event)
  const hours = parseInt(query.hours as string) || 24

  const startDate = new Date()
  startDate.setHours(startDate.getHours() - hours)

  try {
    // Kiểm tra monitor thuộc project
    const monitor = await Monitor.findOne({ _id: monitorId, projectId: project._id }).lean()
    if (!monitor) {
      throw createError({ statusCode: 404, message: 'Monitor không tồn tại' })
    }

    // Lấy kết quả trong khoảng thời gian
    const results = await Result.find({
      'meta.monitorId': monitorId,
      'timestamp': { $gte: startDate }
    })
      .select('timestamp latency isUp statusCode')
      .sort({ timestamp: 1 })
      .lean()

    // Tính các chỉ số thống kê
    const successResults = results.filter(r => r.isUp)
    const avgLatency = successResults.length > 0
      ? Math.round(successResults.reduce((sum, r) => sum + r.latency, 0) / successResults.length)
      : 0

    const minLatency = successResults.length > 0
      ? Math.min(...successResults.map(r => r.latency))
      : 0

    const maxLatency = successResults.length > 0
      ? Math.max(...successResults.map(r => r.latency))
      : 0

    // Nhóm theo giờ để giảm số điểm dữ liệu
    const groupedData: Record<string, { latencies: number[], isUp: boolean, count: number }> = {}

    results.forEach((result) => {
      const hourKey = new Date(result.timestamp).toISOString().slice(0, 13) // YYYY-MM-DDTHH
      if (!groupedData[hourKey]) {
        groupedData[hourKey] = { latencies: [], isUp: true, count: 0 }
      }
      if (result.isUp) {
        groupedData[hourKey].latencies.push(result.latency)
      }
      if (!result.isUp) {
        groupedData[hourKey].isUp = false
      }
      groupedData[hourKey].count++
    })

    // Chuyển thành mảng cho biểu đồ
    const chartData = Object.keys(groupedData)
      .sort()
      .map((hourKey) => {
        const data = groupedData[hourKey]
        const avgLatencyForHour = data.latencies.length > 0
          ? Math.round(data.latencies.reduce((sum, l) => sum + l, 0) / data.latencies.length)
          : 0

        return {
          timestamp: new Date(hourKey + ':00:00Z').toISOString(),
          avgLatency: avgLatencyForHour,
          isUp: data.isUp,
          count: data.count
        }
      })

    return {
      period: {
        hours,
        startDate,
        endDate: new Date()
      },
      stats: {
        avgLatency,
        minLatency,
        maxLatency,
        totalChecks: results.length,
        successfulChecks: successResults.length
      },
      chartData
    }
  } catch (error) {
    console.error('Lỗi lấy dữ liệu performance:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
