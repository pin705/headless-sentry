import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  search: z.string().optional(),
  monitorId: z.string().optional(),
  source: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export default defineEventHandler(async (event) => {
  const project = await requireProjectMembership(event)
  
  const queryResult = getQuery(event)
  const query = querySchema.parse(queryResult)

  const skip = (query.page - 1) * query.limit

  try {
    // Build query filter
    const filter: any = { projectId: project._id }

    if (query.level) {
      filter.level = query.level
    }

    if (query.search) {
      filter.message = { $regex: query.search, $options: 'i' }
    }

    if (query.monitorId) {
      filter.monitorId = query.monitorId
    }

    if (query.source) {
      filter.source = query.source
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      filter.timestamp = {}
      if (query.startDate) {
        filter.timestamp.$gte = new Date(query.startDate)
      }
      if (query.endDate) {
        filter.timestamp.$lte = new Date(query.endDate)
      }
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      Log.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Log.countDocuments(filter)
    ])

    // Get log level statistics
    const stats = await Log.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ])

    const levelCounts = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit)
        },
        stats: levelCounts
      }
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid query parameters' })
    }
    console.error('Error fetching logs:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
