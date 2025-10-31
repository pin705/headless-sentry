import { z } from 'zod'
import { hashApiKey } from '~~/server/utils/crypto'

const logSchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']),
  message: z.string().min(1).max(5000),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  monitorId: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const batchLogSchema = z.object({
  logs: z.array(logSchema).min(1).max(100)
})

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

    // Check if API key has log:write permission
    if (!apiKeyDoc.permissions.includes('log:write')) {
      throw createError({ statusCode: 403, message: 'API key does not have log:write permission' })
    }

    // Update last used timestamp
    apiKeyDoc.lastUsedAt = new Date()
    await apiKeyDoc.save()

    // Parse request body
    const body = await readBody(event)

    // Support both single log and batch logs
    let logsToInsert
    if (Array.isArray(body.logs)) {
      const batchData = batchLogSchema.parse(body)
      logsToInsert = batchData.logs
    } else {
      const singleLog = logSchema.parse(body)
      logsToInsert = [singleLog]
    }

    // Prepare logs for insertion
    const logs = logsToInsert.map((log: any) => ({
      projectId: apiKeyDoc.projectId,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
      level: log.level,
      message: log.message,
      metadata: log.metadata || {},
      monitorId: log.monitorId || null,
      source: log.source || 'application',
      tags: log.tags || []
    }))

    // Insert logs
    await Log.insertMany(logs)

    // Check for ERROR threshold alerts (async, don't block response)
    checkErrorLogThreshold(apiKeyDoc.projectId).catch(err =>
      console.error('Error checking log threshold:', err)
    )

    return {
      success: true,
      message: `${logs.length} log(s) ingested successfully`
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid log data' })
    }
    console.error('Error ingesting logs:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})

// Helper function to check error log threshold
async function checkErrorLogThreshold(projectId: any) {
  // TODO: Make these configurable per project in project settings
  const ERROR_THRESHOLD = 10 // errors
  const TIME_WINDOW = 5 * 60 * 1000 // 5 minutes in milliseconds

  const windowStart = new Date(Date.now() - TIME_WINDOW)

  const errorCount = await Log.countDocuments({
    projectId,
    level: 'ERROR',
    timestamp: { $gte: windowStart }
  })

  // If errors exceed threshold, trigger alert
  if (errorCount > ERROR_THRESHOLD) {
    // TODO: Implement alert logic (send notification to project members)
    // Consider integrating with existing alert system in server/utils/sendMail.ts
    console.log(`[ALERT] Project ${projectId} has ${errorCount} ERROR logs in the last ${TIME_WINDOW / 60000} minutes`)
  }
}
