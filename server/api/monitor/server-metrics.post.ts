import { z } from 'zod'
import crypto from 'crypto'

const serverMetricsSchema = z.object({
  monitorId: z.string(),
  cpuUsage: z.number().min(0).max(100),
  memoryUsage: z.number().min(0).max(100),
  memoryUsedMB: z.number().min(0),
  memoryTotalMB: z.number().min(0),
  diskUsage: z.number().min(0).max(100),
  diskUsedGB: z.number().min(0),
  diskTotalGB: z.number().min(0),
  networkIn: z.number().min(0).optional(),
  networkOut: z.number().min(0).optional(),
  loadAverage: z.array(z.number()).length(3).optional(),
  timestamp: z.string().datetime().optional()
})

// Helper to hash API key
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export default defineEventHandler(async (event) => {
  // Get API key from header
  const apiKey = getHeader(event, 'x-api-key') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'API key required' })
  }

  try {
    // Find and validate API key
    const keyHash = hashApiKey(apiKey)
    const apiKeyDoc = await ApiKey.findOne({
      keyHash,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })

    if (!apiKeyDoc) {
      throw createError({ statusCode: 401, message: 'Invalid or expired API key' })
    }

    // Check if API key has monitor:write permission
    if (!apiKeyDoc.permissions.includes('monitor:write') && !apiKeyDoc.permissions.includes('heartbeat:write')) {
      throw createError({ statusCode: 403, message: 'API key does not have required permissions' })
    }

    // Update last used timestamp
    apiKeyDoc.lastUsedAt = new Date()
    await apiKeyDoc.save()

    // Parse and validate metrics
    const body = await readBody(event)
    const metrics = serverMetricsSchema.parse(body)

    // Verify monitor exists and belongs to the project
    const monitor = await Monitor.findOne({
      _id: metrics.monitorId,
      projectId: apiKeyDoc.projectId,
      type: 'server'
    })

    if (!monitor) {
      throw createError({ statusCode: 404, message: 'Server monitor not found' })
    }

    // Calculate isUp based on thresholds
    const cpuThreshold = monitor.serverConfig?.cpuThreshold || 80
    const memoryThreshold = monitor.serverConfig?.memoryThreshold || 80
    const diskThreshold = monitor.serverConfig?.diskThreshold || 90

    const isUp = metrics.cpuUsage < cpuThreshold
                 && metrics.memoryUsage < memoryThreshold
                 && metrics.diskUsage < diskThreshold

    // Store metrics as a result
    const result = await Result.create({
      timestamp: metrics.timestamp ? new Date(metrics.timestamp) : new Date(),
      meta: {
        monitorId: monitor._id,
        projectId: apiKeyDoc.projectId,
        location: 'agent'
      },
      latency: 0, // Not applicable for server monitoring
      statusCode: isUp ? 200 : 500,
      isUp,
      errorMessage: isUp ? null : 'Resource usage exceeds threshold',
      serverMetrics: {
        cpuUsage: metrics.cpuUsage,
        memoryUsage: metrics.memoryUsage,
        memoryUsedMB: metrics.memoryUsedMB,
        memoryTotalMB: metrics.memoryTotalMB,
        diskUsage: metrics.diskUsage,
        diskUsedGB: metrics.diskUsedGB,
        diskTotalGB: metrics.diskTotalGB,
        networkIn: metrics.networkIn || 0,
        networkOut: metrics.networkOut || 0,
        loadAverage: metrics.loadAverage || []
      }
    })

    // Check if alerts should be triggered
    if (!isUp) {
      const { canSendAlert, sendAlerts, updateLastAlertedAt } = await import('~/server/utils/alerts')

      // Check if we can send alert (cooldown check)
      if (canSendAlert(monitor.alertConfig?.lastAlertedAt)) {
        const alertDetails = []
        if (metrics.cpuUsage >= cpuThreshold) {
          alertDetails.push(`CPU: ${metrics.cpuUsage}% (ngưỡng: ${cpuThreshold}%)`)
        }
        if (metrics.memoryUsage >= memoryThreshold) {
          alertDetails.push(`RAM: ${metrics.memoryUsage}% (ngưỡng: ${memoryThreshold}%)`)
        }
        if (metrics.diskUsage >= diskThreshold) {
          alertDetails.push(`Disk: ${metrics.diskUsage}% (ngưỡng: ${diskThreshold}%)`)
        }

        await sendAlerts([{
          monitor: monitor as any,
          type: 'Server Resource Alert',
          details: alertDetails.join(', ')
        }])

        await updateLastAlertedAt([monitor._id.toString()])
      }
    }

    return {
      success: true,
      message: 'Server metrics recorded successfully',
      data: {
        isUp,
        thresholds: {
          cpu: cpuThreshold,
          memory: memoryThreshold,
          disk: diskThreshold
        }
      }
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid metrics data' })
    }
    console.error('Error recording server metrics:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
