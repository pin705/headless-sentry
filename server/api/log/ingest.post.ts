import { z } from 'zod'
import crypto from 'crypto'

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
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  
  const errorCount = await Log.countDocuments({
    projectId,
    level: 'ERROR',
    timestamp: { $gte: fiveMinutesAgo }
  })

  // If more than 10 errors in 5 minutes, trigger alert
  if (errorCount > 10) {
    // TODO: Implement alert logic (send notification to project members)
    console.log(`[ALERT] Project ${projectId} has ${errorCount} ERROR logs in the last 5 minutes`)
  }
}
