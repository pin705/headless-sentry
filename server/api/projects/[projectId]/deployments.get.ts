import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  environment: z.enum(['production', 'staging', 'development']).optional(),
  status: z.enum(['success', 'failed', 'rollback']).optional(),
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

    if (query.environment) {
      filter.environment = query.environment
    }

    if (query.status) {
      filter.status = query.status
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

    // Fetch deployments with pagination
    const [deployments, total] = await Promise.all([
      Deployment.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Deployment.countDocuments(filter)
    ])

    return {
      success: true,
      data: {
        deployments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit)
        }
      }
    }
  } catch (error: any) {
    if (error.errors) {
      throw createError({ statusCode: 400, message: 'Invalid query parameters' })
    }
    console.error('Error fetching deployments:', error)
    throw createError({ statusCode: 500, message: 'Server error' })
  }
})
