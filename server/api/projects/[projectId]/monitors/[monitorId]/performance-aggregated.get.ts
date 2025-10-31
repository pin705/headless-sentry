import { z } from 'zod'
import { validateObjectId } from '~~/server/utils/validation'

const querySchema = z.object({
  hours: z.coerce.number().min(1).max(720).default(24), // Max 30 days
  aggregation: z.enum(['minute', 'hour', 'day']).optional()
})

export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  const monitorId = getRouterParam(event, 'monitorId')
  const monitorIdObj = validateObjectId(monitorId, 'Monitor ID')

  const queryResult = getQuery(event)
  const query = querySchema.parse(queryResult)

  const startDate = new Date()
  startDate.setHours(startDate.getHours() - query.hours)

  try {
    // Check monitor belongs to project
    const monitor = await Monitor.findOne({ _id: monitorIdObj, projectId: project._id }).lean()
    if (!monitor) {
      throw createError({ statusCode: 404, message: 'Monitor not found' })
    }

    // Auto-determine aggregation level based on time range
    let aggregation = query.aggregation
    if (!aggregation) {
      if (query.hours <= 6) aggregation = 'minute'
      else if (query.hours <= 72) aggregation = 'hour'
      else aggregation = 'day'
    }

    // Build aggregation pipeline
    let dateFormat: string
    switch (aggregation) {
      case 'minute':
        dateFormat = '%Y-%m-%dT%H:%M:00Z'
        break
      case 'day':
        dateFormat = '%Y-%m-%d'
        break
      case 'hour':
      default:
        dateFormat = '%Y-%m-%dT%H:00:00Z'
    }

    const pipeline = [
      {
        $match: {
          'meta.monitorId': monitorIdObj,
          'timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$timestamp' }
          },
          avgLatency: { $avg: '$latency' },
          minLatency: { $min: '$latency' },
          maxLatency: { $max: '$latency' },
          count: { $sum: 1 },
          upCount: { $sum: { $cond: ['$isUp', 1, 0] } },
          downCount: { $sum: { $cond: ['$isUp', 0, 1] } },
          // Server metrics (if available)
          avgCpuUsage: { $avg: '$serverMetrics.cpuUsage' },
          avgMemoryUsage: { $avg: '$serverMetrics.memoryUsage' },
          avgDiskUsage: { $avg: '$serverMetrics.diskUsage' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]

    const aggregatedData = await Result.aggregate(pipeline)

    // Transform data for frontend
    const chartData = aggregatedData.map((item: any) => ({
      timestamp: item._id,
      avgLatency: Math.round(item.avgLatency || 0),
      minLatency: Math.round(item.minLatency || 0),
      maxLatency: Math.round(item.maxLatency || 0),
      count: item.count,
      upCount: item.upCount,
      downCount: item.downCount,
      uptimePercent: item.count > 0 ? Math.round((item.upCount / item.count) * 100 * 100) / 100 : 0,
      isUp: item.upCount > item.downCount,
      // Server metrics
      avgCpuUsage: item.avgCpuUsage ? Math.round(item.avgCpuUsage * 100) / 100 : null,
      avgMemoryUsage: item.avgMemoryUsage ? Math.round(item.avgMemoryUsage * 100) / 100 : null,
      avgDiskUsage: item.avgDiskUsage ? Math.round(item.avgDiskUsage * 100) / 100 : null
    }))

    // Calculate overall statistics
    const totalStats = await Result.aggregate([
      {
        $match: {
          'meta.monitorId': monitorIdObj,
          'timestamp': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgLatency: { $avg: '$latency' },
          minLatency: { $min: '$latency' },
          maxLatency: { $max: '$latency' },
          totalChecks: { $sum: 1 },
          successfulChecks: { $sum: { $cond: ['$isUp', 1, 0] } },
          avgCpuUsage: { $avg: '$serverMetrics.cpuUsage' },
          avgMemoryUsage: { $avg: '$serverMetrics.memoryUsage' },
          avgDiskUsage: { $avg: '$serverMetrics.diskUsage' }
        }
      }
    ])

    const stats = totalStats[0] || {
      avgLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      totalChecks: 0,
      successfulChecks: 0
    }

    return {
      period: {
        hours: query.hours,
        startDate,
        endDate: new Date(),
        aggregation
      },
      stats: {
        avgLatency: Math.round(stats.avgLatency || 0),
        minLatency: Math.round(stats.minLatency || 0),
        maxLatency: Math.round(stats.maxLatency || 0),
        totalChecks: stats.totalChecks,
        successfulChecks: stats.successfulChecks,
        uptimePercent: stats.totalChecks > 0 
          ? Math.round((stats.successfulChecks / stats.totalChecks) * 100 * 100) / 100 
          : 0,
        // Server metrics
        avgCpuUsage: stats.avgCpuUsage ? Math.round(stats.avgCpuUsage * 100) / 100 : null,
        avgMemoryUsage: stats.avgMemoryUsage ? Math.round(stats.avgMemoryUsage * 100) / 100 : null,
        avgDiskUsage: stats.avgDiskUsage ? Math.round(stats.avgDiskUsage * 100) / 100 : null
      },
      chartData,
      dataPoints: chartData.length
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid query parameters' })
    }
    console.error('Error fetching aggregated performance data:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
