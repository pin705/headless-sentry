// Helper function to calculate average uptime
function calculateAverageUptime(monitorReports: Array<{ uptimePercentage: string | number }>): string {
  if (monitorReports.length === 0) {
    return 'N/A'
  }

  const totalUptime = monitorReports.reduce((sum, m) => {
    const uptime = typeof m.uptimePercentage === 'string' ? parseFloat(m.uptimePercentage) : m.uptimePercentage
    return sum + (isNaN(uptime) ? 0 : uptime)
  }, 0)

  return (totalUptime / monitorReports.length).toFixed(2)
}

export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  const projectIdObj = project._id

  // Lấy tham số query: days (mặc định 30 ngày)
  const query = getQuery(event)
  const days = parseInt(query.days as string) || 30

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  try {
    // Lấy tất cả monitors của project
    const monitors = await Monitor.find({ projectId: projectIdObj }).select('_id name type').lean()

    if (monitors.length === 0) {
      return {
        period: { days, startDate, endDate: new Date() },
        monitors: []
      }
    }

    const monitorReports = []

    for (const monitor of monitors) {
      // Lấy tất cả kết quả trong khoảng thời gian
      const results = await Result.find({
        'meta.monitorId': monitor._id,
        'timestamp': { $gte: startDate }
      })
        .select('isUp timestamp')
        .lean()

      const totalChecks = results.length
      const successfulChecks = results.filter(r => r.isUp).length
      const failedChecks = totalChecks - successfulChecks

      // Tính uptime percentage
      const uptimePercentage = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(2) : 'N/A'

      // Tính downtime incidents (số lần chuyển từ UP sang DOWN)
      let downtimeIncidents = 0
      let previousState = true // Giả sử bắt đầu là UP

      const sortedResults = results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      for (const result of sortedResults) {
        if (previousState && !result.isUp) {
          downtimeIncidents++
        }
        previousState = result.isUp
      }

      // Tính average latency
      const latencyResults = await Result.find({
        'meta.monitorId': monitor._id,
        'timestamp': { $gte: startDate },
        'isUp': true // Chỉ tính latency cho các request thành công
      })
        .select('latency')
        .lean()

      const avgLatency = latencyResults.length > 0
        ? Math.round(latencyResults.reduce((sum, r) => sum + r.latency, 0) / latencyResults.length)
        : 0

      monitorReports.push({
        monitorId: monitor._id,
        monitorName: monitor.name,
        monitorType: monitor.type || 'http',
        totalChecks,
        successfulChecks,
        failedChecks,
        uptimePercentage,
        downtimeIncidents,
        avgLatency
      })
    }

    return {
      period: {
        days,
        startDate,
        endDate: new Date()
      },
      monitors: monitorReports,
      summary: {
        totalMonitors: monitors.length,
        avgUptimePercentage: calculateAverageUptime(monitorReports)
      }
    }
  } catch (error) {
    console.error('Lỗi tạo báo cáo SLA:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})
